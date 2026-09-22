package com.gymduongdouble.backend.finance.service;

import com.gymduongdouble.backend.common.enums.DebtStatus;
import com.gymduongdouble.backend.common.enums.FinancialCategoryType;
import com.gymduongdouble.backend.common.enums.FinancialTransactionType;
import com.gymduongdouble.backend.common.enums.PaymentMethod;
import com.gymduongdouble.backend.common.enums.PlanType;
import com.gymduongdouble.backend.common.enums.PtLevel;
import com.gymduongdouble.backend.common.enums.RevenueCategory;
import com.gymduongdouble.backend.common.exception.BadRequestException;
import com.gymduongdouble.backend.common.security.SecurityUtils;
import com.gymduongdouble.backend.finance.domain.DebtRecord;
import com.gymduongdouble.backend.finance.domain.FinancialCategory;
import com.gymduongdouble.backend.finance.domain.FinancialTransaction;
import com.gymduongdouble.backend.finance.domain.Payment;
import com.gymduongdouble.backend.finance.repository.DebtRecordRepository;
import com.gymduongdouble.backend.finance.repository.FinancialCategoryRepository;
import com.gymduongdouble.backend.finance.repository.FinancialTransactionRepository;
import com.gymduongdouble.backend.finance.repository.PaymentRepository;
import com.gymduongdouble.backend.finance.web.dto.CreatePaymentRequest;
import com.gymduongdouble.backend.finance.web.dto.PaymentResponse;
import com.gymduongdouble.backend.member.domain.Member;
import com.gymduongdouble.backend.member.service.MemberService;
import com.gymduongdouble.backend.membership.domain.MemberMembership;
import com.gymduongdouble.backend.membership.domain.MembershipPlan;
import com.gymduongdouble.backend.membership.service.MemberMembershipService;
import com.gymduongdouble.backend.user.domain.User;
import com.gymduongdouble.backend.user.repository.UserRepository;
import java.math.BigDecimal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final FinancialCategoryRepository financialCategoryRepository;
    private final FinancialTransactionRepository financialTransactionRepository;
    private final DebtRecordRepository debtRecordRepository;
    private final MemberService memberService;
    private final MemberMembershipService memberMembershipService;
    private final UserRepository userRepository;

    @Transactional
    public PaymentResponse create(CreatePaymentRequest request) {
        Member member = memberService.findEntity(request.memberId());
        MemberMembership membership = request.membershipId() == null
            ? null
            : memberMembershipService.findEntity(request.membershipId());

        if (membership != null && !membership.getMember().getId().equals(member.getId())) {
            throw new BadRequestException("Lượt đăng ký gói không thuộc khách hàng này.");
        }

        RevenueCategory revenueCategory = request.revenueCategory() == null
            ? inferRevenueCategory(membership)
            : request.revenueCategory();

        Payment payment = new Payment();
        payment.setMember(member);
        payment.setMembership(membership);
        payment.setPaymentDate(request.paymentDate());
        payment.setAmount(request.amount());
        payment.setPaymentMethod(request.paymentMethod() == null ? PaymentMethod.CASH : request.paymentMethod());
        payment.setRevenueCategory(revenueCategory);
        payment.setDescription(request.description());
        payment.setCreatedBy(currentUserOrNull());

        Payment savedPayment = paymentRepository.save(payment);
        syncMembershipDebt(membership, request.amount());
        createIncomeTransaction(savedPayment, revenueCategory);

        return PaymentResponse.from(savedPayment);
    }

    private RevenueCategory inferRevenueCategory(MemberMembership membership) {
        if (membership == null) {
            return RevenueCategory.OTHER_INCOME;
        }

        MembershipPlan plan = membership.getPlan();
        if (plan.getPlanType() == PlanType.SELF_TRAINING) {
            return RevenueCategory.SELF_TRAINING;
        }
        if (plan.getPlanType() == PlanType.GUIDANCE) {
            return RevenueCategory.GUIDANCE;
        }
        if (plan.getPlanType() == PlanType.PT && plan.getPtLevel() == PtLevel.NEW) {
            return RevenueCategory.PT_NEW;
        }
        if (plan.getPlanType() == PlanType.PT) {
            return RevenueCategory.PT_MAIN;
        }
        return RevenueCategory.OTHER_INCOME;
    }

    private void syncMembershipDebt(MemberMembership membership, BigDecimal amount) {
        if (membership == null) {
            return;
        }

        BigDecimal paidAmount = membership.getPaidAmount().add(amount);
        BigDecimal payableAmount = membership.getActualPrice().subtract(membership.getDiscountAmount()).max(BigDecimal.ZERO);
        BigDecimal debtAmount = payableAmount.subtract(paidAmount).max(BigDecimal.ZERO);
        membership.setPaidAmount(paidAmount);
        membership.setDebtAmount(debtAmount);

        debtRecordRepository.findByMembershipIdOrderByCreatedAtDesc(membership.getId()).stream()
            .findFirst()
            .ifPresent(debtRecord -> {
                debtRecord.setPaidAmount(paidAmount.min(debtRecord.getOriginalAmount()));
                debtRecord.setRemainingAmount(debtAmount);
                debtRecord.setStatus(resolveDebtStatus(debtRecord));
            });
    }

    private DebtStatus resolveDebtStatus(DebtRecord debtRecord) {
        if (debtRecord.getRemainingAmount().compareTo(BigDecimal.ZERO) <= 0) {
            return DebtStatus.PAID;
        }
        if (debtRecord.getPaidAmount().compareTo(BigDecimal.ZERO) > 0) {
            return DebtStatus.PARTIALLY_PAID;
        }
        return DebtStatus.OPEN;
    }

    private void createIncomeTransaction(Payment payment, RevenueCategory revenueCategory) {
        FinancialCategory category = financialCategoryRepository.findByCode(revenueCategory.name())
            .orElseGet(() -> {
                FinancialCategory newCategory = new FinancialCategory();
                newCategory.setType(FinancialCategoryType.INCOME);
                newCategory.setCode(revenueCategory.name());
                newCategory.setName(revenueCategory.name());
                newCategory.setActive(true);
                return financialCategoryRepository.save(newCategory);
            });

        FinancialTransaction transaction = new FinancialTransaction();
        transaction.setType(FinancialTransactionType.INCOME);
        transaction.setCategory(category);
        transaction.setAmount(payment.getAmount());
        transaction.setTransactionDate(payment.getPaymentDate());
        transaction.setMember(payment.getMember());
        transaction.setMembership(payment.getMembership());
        transaction.setPayment(payment);
        transaction.setDescription(payment.getDescription());
        transaction.setCreatedBy(payment.getCreatedBy());
        financialTransactionRepository.save(transaction);
    }

    private User currentUserOrNull() {
        Long currentUserId = SecurityUtils.currentUserIdOrNull();
        return currentUserId == null ? null : userRepository.findById(currentUserId).orElse(null);
    }
}
