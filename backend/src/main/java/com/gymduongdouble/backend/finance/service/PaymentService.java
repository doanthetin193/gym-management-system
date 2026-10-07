package com.gymduongdouble.backend.finance.service;

import com.gymduongdouble.backend.common.enums.DebtStatus;
import com.gymduongdouble.backend.common.enums.FinancialCategoryType;
import com.gymduongdouble.backend.common.enums.FinancialTransactionType;
import com.gymduongdouble.backend.common.enums.PaymentMethod;
import com.gymduongdouble.backend.common.enums.PlanType;
import com.gymduongdouble.backend.common.enums.PtLevel;
import com.gymduongdouble.backend.common.enums.RevenueCategory;
import com.gymduongdouble.backend.common.exception.BadRequestException;
import com.gymduongdouble.backend.common.exception.ResourceNotFoundException;
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
import com.gymduongdouble.backend.finance.web.dto.DebtRecordResponse;
import com.gymduongdouble.backend.finance.web.dto.PaymentResponse;
import com.gymduongdouble.backend.member.domain.Member;
import com.gymduongdouble.backend.member.service.MemberAccessService;
import com.gymduongdouble.backend.member.service.MemberService;
import com.gymduongdouble.backend.membership.domain.MemberMembership;
import com.gymduongdouble.backend.membership.domain.MembershipPlan;
import com.gymduongdouble.backend.membership.service.MemberMembershipService;
import com.gymduongdouble.backend.user.domain.User;
import com.gymduongdouble.backend.user.repository.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import java.util.List;
import org.springframework.data.domain.Sort;
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
    private final MemberAccessService memberAccessService;

    @Transactional
    public PaymentResponse create(CreatePaymentRequest request) {
        memberAccessService.ensureCanAccessMember(request.memberId());
        Member member = memberService.findEntity(request.memberId());
        MemberMembership membership = request.membershipId() == null
            ? null
            : memberMembershipService.findEntity(request.membershipId());
        DebtRecord debtRecord = resolveDebtRecord(request, member, membership);

        if (membership != null && !membership.getMember().getId().equals(member.getId())) {
            throw new BadRequestException("Lượt đăng ký gói không thuộc khách hàng này.");
        }
        if (debtRecord != null) {
            validateDebtRecord(debtRecord, member, membership);
            membership = debtRecord.getMembership() == null ? membership : debtRecord.getMembership();
            validatePaymentAmount(request.amount(), debtRecord);
        } else if (request.membershipId() != null) {
            throw new BadRequestException("Lượt đăng ký gói này không còn khoản công nợ cần thu.");
        }

        RevenueCategory revenueCategory = request.revenueCategory() == null
            ? inferRevenueCategory(membership)
            : request.revenueCategory();

        Payment payment = new Payment();
        payment.setMember(member);
        payment.setMembership(membership);
        payment.setDebtRecord(debtRecord);
        payment.setPaymentDate(request.paymentDate() == null ? LocalDate.now() : request.paymentDate());
        payment.setAmount(request.amount());
        payment.setPaymentMethod(request.paymentMethod());
        payment.setRevenueCategory(revenueCategory);
        payment.setDescription(request.note());
        payment.setCreatedBy(currentUserOrNull());

        Payment savedPayment = paymentRepository.save(payment);
        syncDebtAndMembership(debtRecord, membership, request.amount());
        createIncomeTransaction(savedPayment, revenueCategory);

        return PaymentResponse.from(savedPayment);
    }

    @Transactional(readOnly = true)
    public List<DebtRecordResponse> listDebts(Long memberId, DebtStatus status) {
        return debtRecordRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
            .filter(debtRecord -> memberAccessService.canAccessMember(debtRecord.getMember().getId()))
            .filter(debtRecord -> memberId == null || debtRecord.getMember().getId().equals(memberId))
            .filter(debtRecord -> matchesDebtStatus(debtRecord, status))
            .map(DebtRecordResponse::from)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> listPayments(
        Long memberId,
        LocalDate fromDate,
        LocalDate toDate,
        PaymentMethod paymentMethod
    ) {
        return paymentRepository.findAll(Sort.by(Sort.Direction.DESC, "paymentDate").and(Sort.by(Sort.Direction.DESC, "id"))).stream()
            .filter(payment -> memberAccessService.canAccessMember(payment.getMember().getId()))
            .filter(payment -> memberId == null || payment.getMember().getId().equals(memberId))
            .filter(payment -> fromDate == null || !payment.getPaymentDate().isBefore(fromDate))
            .filter(payment -> toDate == null || !payment.getPaymentDate().isAfter(toDate))
            .filter(payment -> paymentMethod == null || payment.getPaymentMethod() == paymentMethod)
            .map(PaymentResponse::from)
            .toList();
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

    private DebtRecord resolveDebtRecord(
        CreatePaymentRequest request,
        Member member,
        MemberMembership membership
    ) {
        if (request.debtRecordId() != null) {
            return debtRecordRepository.findById(request.debtRecordId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khoản công nợ."));
        }
        if (membership == null) {
            return null;
        }
        return debtRecordRepository.findByMembershipIdOrderByCreatedAtDesc(membership.getId()).stream()
            .filter(debtRecord -> debtRecord.getStatus() != DebtStatus.PAID)
            .filter(debtRecord -> debtRecord.getStatus() != DebtStatus.CANCELLED)
            .findFirst()
            .orElse(null);
    }

    private void validateDebtRecord(DebtRecord debtRecord, Member member, MemberMembership membership) {
        if (!debtRecord.getMember().getId().equals(member.getId())) {
            throw new BadRequestException("Khoản công nợ không thuộc khách hàng này.");
        }
        if (membership != null && debtRecord.getMembership() != null
            && !debtRecord.getMembership().getId().equals(membership.getId())) {
            throw new BadRequestException("Khoản công nợ không thuộc lượt đăng ký gói này.");
        }
        if (debtRecord.getStatus() == DebtStatus.PAID) {
            throw new BadRequestException("Khoản công nợ đã được thanh toán đủ.");
        }
        if (debtRecord.getStatus() == DebtStatus.CANCELLED) {
            throw new BadRequestException("Khoản công nợ đã bị hủy.");
        }
    }

    private void validatePaymentAmount(BigDecimal amount, DebtRecord debtRecord) {
        if (amount.compareTo(debtRecord.getRemainingAmount()) > 0) {
            throw new BadRequestException("Số tiền thu không được lớn hơn số tiền còn nợ.");
        }
    }

    private void syncDebtAndMembership(DebtRecord debtRecord, MemberMembership membership, BigDecimal amount) {
        if (debtRecord == null && membership == null) {
            return;
        }

        if (debtRecord != null) {
            BigDecimal paidAmount = debtRecord.getPaidAmount().add(amount);
            BigDecimal remainingAmount = debtRecord.getRemainingAmount().subtract(amount).max(BigDecimal.ZERO);
            debtRecord.setPaidAmount(paidAmount.min(debtRecord.getOriginalAmount()));
            debtRecord.setRemainingAmount(remainingAmount);
            debtRecord.setStatus(resolveDebtStatus(debtRecord));
        }

        if (membership != null) {
            BigDecimal paidAmount = membership.getPaidAmount().add(amount);
            BigDecimal payableAmount = membership.getActualPrice().subtract(membership.getDiscountAmount()).max(BigDecimal.ZERO);
            BigDecimal debtAmount = payableAmount.subtract(paidAmount).max(BigDecimal.ZERO);
            membership.setPaidAmount(paidAmount.min(payableAmount));
            membership.setDebtAmount(debtRecord == null ? debtAmount : debtRecord.getRemainingAmount());
        }
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

    private boolean matchesDebtStatus(DebtRecord debtRecord, DebtStatus status) {
        if (status == null) {
            return true;
        }
        if (status == DebtStatus.OPEN) {
            return debtRecord.getStatus() == DebtStatus.OPEN || debtRecord.getStatus() == DebtStatus.PARTIALLY_PAID;
        }
        return debtRecord.getStatus() == status;
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
