package com.gymduongdouble.backend.membership.service;

import com.gymduongdouble.backend.common.enums.DebtStatus;
import com.gymduongdouble.backend.common.enums.MembershipStatus;
import com.gymduongdouble.backend.common.enums.PaymentMethod;
import com.gymduongdouble.backend.common.enums.PlanType;
import com.gymduongdouble.backend.common.enums.PtLevel;
import com.gymduongdouble.backend.common.enums.RevenueCategory;
import com.gymduongdouble.backend.common.enums.SessionPackageStatus;
import com.gymduongdouble.backend.common.enums.UserStatus;
import com.gymduongdouble.backend.common.exception.BadRequestException;
import com.gymduongdouble.backend.common.exception.ResourceNotFoundException;
import com.gymduongdouble.backend.common.security.AuthenticatedUser;
import com.gymduongdouble.backend.common.security.SecurityUtils;
import com.gymduongdouble.backend.common.time.AppClock;
import com.gymduongdouble.backend.finance.domain.DebtRecord;
import com.gymduongdouble.backend.finance.domain.Payment;
import com.gymduongdouble.backend.finance.repository.DebtRecordRepository;
import com.gymduongdouble.backend.finance.repository.PaymentRepository;
import com.gymduongdouble.backend.member.domain.Member;
import com.gymduongdouble.backend.member.service.MemberAccessService;
import com.gymduongdouble.backend.member.service.MemberService;
import com.gymduongdouble.backend.membership.domain.MemberMembership;
import com.gymduongdouble.backend.membership.domain.MembershipPlan;
import com.gymduongdouble.backend.membership.repository.MemberMembershipRepository;
import com.gymduongdouble.backend.membership.repository.MembershipPlanRepository;
import com.gymduongdouble.backend.membership.web.dto.CreateMemberMembershipRequest;
import com.gymduongdouble.backend.membership.web.dto.MemberMembershipResponse;
import com.gymduongdouble.backend.pt.domain.PtSessionPackage;
import com.gymduongdouble.backend.pt.repository.PtProfileRepository;
import com.gymduongdouble.backend.pt.repository.PtSessionPackageRepository;
import com.gymduongdouble.backend.user.domain.User;
import com.gymduongdouble.backend.user.repository.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MemberMembershipService {

    private final MemberService memberService;
    private final MembershipPlanRepository membershipPlanRepository;
    private final MemberMembershipRepository memberMembershipRepository;
    private final DebtRecordRepository debtRecordRepository;
    private final PaymentRepository paymentRepository;
    private final PtSessionPackageRepository ptSessionPackageRepository;
    private final PtProfileRepository ptProfileRepository;
    private final UserRepository userRepository;
    private final MemberAccessService memberAccessService;
    private final MembershipLifecyclePolicy membershipLifecyclePolicy;

    @Transactional
    public MemberMembershipResponse create(Long memberId, CreateMemberMembershipRequest request) {
        Member member = memberService.findEntity(memberId);
        MembershipPlan plan = membershipPlanRepository.findById(request.planId())
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy gói tập."));

        if (!plan.isActive()) {
            throw new BadRequestException("Gói tập hiện không hoạt động.");
        }

        memberAccessService.ensureCanCreateMembership(memberId, plan.getPlanType());
        LocalDate startDate = resolveStartDate(member.getId(), request.startDate());
        LocalDate endDate = resolveEndDate(plan, request, startDate);
        ensureHistoricalDatesDoNotOverlap(member.getId(), startDate, endDate);
        BigDecimal actualPrice = request.actualPrice() == null ? plan.getDefaultPrice() : request.actualPrice();
        BigDecimal discountAmount = request.discountAmount() == null ? BigDecimal.ZERO : request.discountAmount();
        if (discountAmount.compareTo(actualPrice) > 0) {
            throw new BadRequestException("Giảm giá không được lớn hơn giá bán thực tế.");
        }
        BigDecimal payableAmount = actualPrice.subtract(discountAmount).max(BigDecimal.ZERO);
        BigDecimal initialPaidAmount = request.initialPaidAmount() == null ? BigDecimal.ZERO : request.initialPaidAmount();
        if (initialPaidAmount.compareTo(payableAmount) > 0) {
            throw new BadRequestException("Tiền trả trước không được lớn hơn số tiền phải thu.");
        }
        if (initialPaidAmount.compareTo(BigDecimal.ZERO) > 0 && request.initialPaymentMethod() == null) {
            throw new BadRequestException("Phương thức thanh toán là bắt buộc khi có tiền trả trước.");
        }
        BigDecimal debtAmount = payableAmount;

        MemberMembership membership = new MemberMembership();
        membership.setMember(member);
        membership.setPlan(plan);
        membership.setSoldByUser(resolveSoldByUser(request.soldByUserId()));
        membership.setStartDate(startDate);
        membership.setEndDate(endDate);
        membership.setActualPrice(actualPrice);
        membership.setDiscountAmount(discountAmount);
        membership.setPaidAmount(BigDecimal.ZERO);
        membership.setDebtAmount(debtAmount);
        membership.setStatus(MembershipStatus.ACTIVE);
        membership.setNote(request.note());
        membership.setCreatedBy(currentUserOrNull());

        MemberMembership saved = memberMembershipRepository.save(membership);
        DebtRecord debtRecord = createDebtIfNeeded(saved, debtAmount);
        createInitialPaymentIfNeeded(saved, debtRecord, initialPaidAmount, request);
        createPtPackageIfNeeded(saved, resolvePtUserId(request.ptUserId(), plan.getPlanType()));

        return MemberMembershipResponse.from(saved, membershipLifecyclePolicy.effectiveStatus(saved, AppClock.today()));
    }

    @Transactional(readOnly = true)
    public List<MemberMembershipResponse> listByMember(Long memberId) {
        memberAccessService.ensureCanAccessMember(memberId);
        LocalDate today = AppClock.today();
        return memberMembershipRepository.findByMemberIdOrderByStartDateDesc(memberId).stream()
            .map(membership -> MemberMembershipResponse.from(
                membership,
                membershipLifecyclePolicy.effectiveStatus(membership, today)
            ))
            .toList();
    }

    @Transactional(readOnly = true)
    public MemberMembership findEntity(Long id) {
        return memberMembershipRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lượt đăng ký gói."));
    }

    private LocalDate resolveStartDate(Long memberId, LocalDate requestedStartDate) {
        if (requestedStartDate.isBefore(AppClock.today())) {
            return requestedStartDate;
        }
        return memberMembershipRepository.findByMemberIdOrderByStartDateDesc(memberId).stream()
            .filter(membership -> membership.getStatus() != MembershipStatus.CANCELLED)
            .filter(membership -> !membership.getEndDate().isBefore(requestedStartDate))
            .map(MemberMembership::getEndDate)
            .max(LocalDate::compareTo)
            .map(endDate -> endDate.plusDays(1))
            .orElse(requestedStartDate);
    }

    private void ensureHistoricalDatesDoNotOverlap(Long memberId, LocalDate startDate, LocalDate endDate) {
        if (!startDate.isBefore(AppClock.today())) {
            return;
        }
        boolean overlapsExistingMembership = memberMembershipRepository.findByMemberIdOrderByStartDateDesc(memberId).stream()
            .filter(membership -> membership.getStatus() != MembershipStatus.CANCELLED)
            .anyMatch(membership -> !membership.getEndDate().isBefore(startDate)
                && !membership.getStartDate().isAfter(endDate));
        if (overlapsExistingMembership) {
            throw new BadRequestException("Gói lịch sử bị chồng thời hạn với gói đã có. Vui lòng kiểm tra lại ngày bắt đầu và kết thúc.");
        }
    }

    private LocalDate resolveEndDate(MembershipPlan plan, CreateMemberMembershipRequest request, LocalDate startDate) {
        if (request.endDate() != null) {
            if (request.endDate().isBefore(startDate)) {
                throw new BadRequestException("Ngày kết thúc không được trước ngày bắt đầu thực tế.");
            }
            return request.endDate();
        }
        if (plan.getDurationDays() == null || plan.getDurationDays() <= 0) {
            throw new BadRequestException("Gói chưa có thời hạn, cần nhập ngày kết thúc.");
        }
        return startDate.plusDays(plan.getDurationDays() - 1L);
    }

    private DebtRecord createDebtIfNeeded(MemberMembership membership, BigDecimal debtAmount) {
        if (debtAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return null;
        }

        DebtRecord debtRecord = new DebtRecord();
        debtRecord.setMember(membership.getMember());
        debtRecord.setMembership(membership);
        debtRecord.setOriginalAmount(debtAmount);
        debtRecord.setPaidAmount(BigDecimal.ZERO);
        debtRecord.setRemainingAmount(debtAmount);
        debtRecord.setDueDate(membership.getStartDate());
        debtRecord.setStatus(DebtStatus.OPEN);
        debtRecord.setNote("Công nợ phát sinh khi đăng ký gói.");
        return debtRecordRepository.save(debtRecord);
    }

    private void createInitialPaymentIfNeeded(
        MemberMembership membership,
        DebtRecord debtRecord,
        BigDecimal amount,
        CreateMemberMembershipRequest request
    ) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }
        if (debtRecord == null) {
            throw new BadRequestException("Gói này không còn khoản cần thu.");
        }
        LocalDate paymentDate = resolveInitialPaymentDate(request.initialPaymentDate());

        Payment payment = new Payment();
        payment.setMember(membership.getMember());
        payment.setMembership(membership);
        payment.setDebtRecord(debtRecord);
        payment.setPaymentDate(paymentDate);
        payment.setAmount(amount);
        payment.setPaymentMethod(request.initialPaymentMethod() == null ? PaymentMethod.CASH : request.initialPaymentMethod());
        payment.setRevenueCategory(inferRevenueCategory(membership));
        payment.setDescription(request.initialPaymentNote() == null ? request.note() : request.initialPaymentNote());
        payment.setCreatedBy(currentUserOrNull());
        paymentRepository.save(payment);

        syncDebtAndMembership(debtRecord, membership, amount);
    }

    private LocalDate resolveInitialPaymentDate(LocalDate requestedDate) {
        LocalDate paymentDate = requestedDate == null ? AppClock.today() : requestedDate;
        if (paymentDate.isAfter(AppClock.today())) {
            throw new BadRequestException("Ngày thu tiền ban đầu không được ở tương lai.");
        }
        return paymentDate;
    }

    private void createPtPackageIfNeeded(MemberMembership membership, Long ptUserId) {
        MembershipPlan plan = membership.getPlan();
        if (plan.getPlanType() != PlanType.PT) {
            return;
        }

        PtSessionPackage sessionPackage = new PtSessionPackage();
        sessionPackage.setMember(membership.getMember());
        sessionPackage.setPtUser(findPtUserOrNull(ptUserId));
        sessionPackage.setMembership(membership);
        sessionPackage.setTotalPtSessions(valueOrZero(plan.getPtSessionCount()));
        sessionPackage.setUsedPtSessions(0);
        sessionPackage.setRemainingPtSessions(valueOrZero(plan.getPtSessionCount()));
        sessionPackage.setTotalPracticeSessions(valueOrZero(plan.getPracticeSessionCount()));
        sessionPackage.setUsedPracticeSessions(0);
        sessionPackage.setRemainingPracticeSessions(valueOrZero(plan.getPracticeSessionCount()));
        sessionPackage.setStartDate(membership.getStartDate());
        sessionPackage.setEndDate(membership.getEndDate());
        sessionPackage.setStatus(SessionPackageStatus.ACTIVE);
        ptSessionPackageRepository.save(sessionPackage);
    }

    private Integer valueOrZero(Integer value) {
        return value == null ? 0 : value;
    }

    private void syncDebtAndMembership(DebtRecord debtRecord, MemberMembership membership, BigDecimal amount) {
        BigDecimal paidAmount = debtRecord.getPaidAmount().add(amount);
        BigDecimal remainingAmount = debtRecord.getRemainingAmount().subtract(amount).max(BigDecimal.ZERO);
        debtRecord.setPaidAmount(paidAmount.min(debtRecord.getOriginalAmount()));
        debtRecord.setRemainingAmount(remainingAmount);
        debtRecord.setStatus(resolveDebtStatus(debtRecord));

        BigDecimal membershipPaidAmount = membership.getPaidAmount().add(amount);
        BigDecimal payableAmount = membership.getActualPrice().subtract(membership.getDiscountAmount()).max(BigDecimal.ZERO);
        membership.setPaidAmount(membershipPaidAmount.min(payableAmount));
        membership.setDebtAmount(debtRecord.getRemainingAmount());
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

    private RevenueCategory inferRevenueCategory(MemberMembership membership) {
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

    private User currentUserOrNull() {
        return SecurityUtils.currentUserIdOrNull() == null ? null : findUserOrNull(SecurityUtils.currentUserIdOrNull());
    }

    private User resolveSoldByUser(Long requestedUserId) {
        if (isOwner()) {
            return findUserOrNull(requestedUserId);
        }
        User currentPt = currentPtUser();
        rejectForeignPtUser(requestedUserId, currentPt.getId());
        return currentPt;
    }

    private Long resolvePtUserId(Long requestedPtUserId, PlanType planType) {
        if (isOwner()) {
            return requestedPtUserId;
        }
        User currentPt = currentPtUser();
        rejectForeignPtUser(requestedPtUserId, currentPt.getId());
        return planType == PlanType.PT ? currentPt.getId() : null;
    }

    private User currentPtUser() {
        User user = currentUserOrNull();
        if (user == null || !hasRole("PT")) {
            throw new AccessDeniedException("Chỉ tài khoản PT mới có thể thực hiện thao tác này.");
        }
        return user;
    }

    private void rejectForeignPtUser(Long requestedUserId, Long currentUserId) {
        if (requestedUserId != null && !requestedUserId.equals(currentUserId)) {
            throw new AccessDeniedException("PT chỉ có thể ghi nhận chính mình là người bán hoặc phụ trách gói.");
        }
    }

    private boolean isOwner() {
        return hasRole("OWNER");
    }

    private boolean hasRole(String roleCode) {
        return SecurityUtils.currentUser()
            .map(AuthenticatedUser::getAuthorities)
            .stream()
            .flatMap(java.util.Collection::stream)
            .anyMatch(authority -> authority.getAuthority().equals("ROLE_" + roleCode));
    }

    private User findUserOrNull(Long id) {
        if (id == null) {
            return null;
        }
        return userRepository.findById(id).orElse(null);
    }

    private User findPtUserOrNull(Long id) {
        User user = findUserOrNull(id);
        if (user != null && user.getRoles().stream().noneMatch(role -> "PT".equals(role.getCode()))) {
            throw new BadRequestException("Người phụ trách gói PT phải là tài khoản PT.");
        }
        if (user != null && user.getStatus() != UserStatus.ACTIVE) {
            throw new BadRequestException("Người phụ trách gói PT phải là tài khoản PT đang hoạt động.");
        }
        if (user != null && ptProfileRepository.findByUserId(user.getId()).stream().noneMatch(profile -> profile.isActive())) {
            throw new BadRequestException("Người phụ trách gói PT phải là tài khoản PT đang hoạt động.");
        }
        return user;
    }
}
