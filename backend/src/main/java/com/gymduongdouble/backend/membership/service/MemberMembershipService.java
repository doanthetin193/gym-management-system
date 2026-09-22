package com.gymduongdouble.backend.membership.service;

import com.gymduongdouble.backend.common.enums.DebtStatus;
import com.gymduongdouble.backend.common.enums.MembershipStatus;
import com.gymduongdouble.backend.common.enums.PlanType;
import com.gymduongdouble.backend.common.enums.SessionPackageStatus;
import com.gymduongdouble.backend.common.exception.BadRequestException;
import com.gymduongdouble.backend.common.exception.ResourceNotFoundException;
import com.gymduongdouble.backend.common.security.SecurityUtils;
import com.gymduongdouble.backend.finance.domain.DebtRecord;
import com.gymduongdouble.backend.finance.repository.DebtRecordRepository;
import com.gymduongdouble.backend.member.domain.Member;
import com.gymduongdouble.backend.member.service.MemberService;
import com.gymduongdouble.backend.membership.domain.MemberMembership;
import com.gymduongdouble.backend.membership.domain.MembershipPlan;
import com.gymduongdouble.backend.membership.repository.MemberMembershipRepository;
import com.gymduongdouble.backend.membership.repository.MembershipPlanRepository;
import com.gymduongdouble.backend.membership.web.dto.CreateMemberMembershipRequest;
import com.gymduongdouble.backend.membership.web.dto.MemberMembershipResponse;
import com.gymduongdouble.backend.pt.domain.PtSessionPackage;
import com.gymduongdouble.backend.pt.repository.PtSessionPackageRepository;
import com.gymduongdouble.backend.user.domain.User;
import com.gymduongdouble.backend.user.repository.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MemberMembershipService {

    private final MemberService memberService;
    private final MembershipPlanRepository membershipPlanRepository;
    private final MemberMembershipRepository memberMembershipRepository;
    private final DebtRecordRepository debtRecordRepository;
    private final PtSessionPackageRepository ptSessionPackageRepository;
    private final UserRepository userRepository;

    @Transactional
    public MemberMembershipResponse create(Long memberId, CreateMemberMembershipRequest request) {
        Member member = memberService.findEntity(memberId);
        MembershipPlan plan = membershipPlanRepository.findById(request.planId())
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy gói tập."));

        if (!plan.isActive()) {
            throw new BadRequestException("Gói tập hiện không hoạt động.");
        }

        LocalDate endDate = resolveEndDate(plan, request);
        BigDecimal actualPrice = request.actualPrice() == null ? plan.getDefaultPrice() : request.actualPrice();
        BigDecimal discountAmount = request.discountAmount() == null ? BigDecimal.ZERO : request.discountAmount();
        BigDecimal debtAmount = actualPrice.subtract(discountAmount).max(BigDecimal.ZERO);

        MemberMembership membership = new MemberMembership();
        membership.setMember(member);
        membership.setPlan(plan);
        membership.setSoldByUser(findUserOrNull(request.soldByUserId()));
        membership.setStartDate(request.startDate());
        membership.setEndDate(endDate);
        membership.setActualPrice(actualPrice);
        membership.setDiscountAmount(discountAmount);
        membership.setPaidAmount(BigDecimal.ZERO);
        membership.setDebtAmount(debtAmount);
        membership.setStatus(MembershipStatus.ACTIVE);
        membership.setNote(request.note());
        membership.setCreatedBy(currentUserOrNull());

        MemberMembership saved = memberMembershipRepository.save(membership);
        createDebtIfNeeded(saved, debtAmount);
        createPtPackageIfNeeded(saved, request.ptUserId());

        return MemberMembershipResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<MemberMembershipResponse> listByMember(Long memberId) {
        return memberMembershipRepository.findByMemberIdOrderByStartDateDesc(memberId).stream()
            .map(MemberMembershipResponse::from)
            .toList();
    }

    @Transactional(readOnly = true)
    public MemberMembership findEntity(Long id) {
        return memberMembershipRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lượt đăng ký gói."));
    }

    private LocalDate resolveEndDate(MembershipPlan plan, CreateMemberMembershipRequest request) {
        if (request.endDate() != null) {
            return request.endDate();
        }
        if (plan.getDurationDays() == null || plan.getDurationDays() <= 0) {
            throw new BadRequestException("Gói chưa có thời hạn, cần nhập ngày kết thúc.");
        }
        return request.startDate().plusDays(plan.getDurationDays() - 1L);
    }

    private void createDebtIfNeeded(MemberMembership membership, BigDecimal debtAmount) {
        if (debtAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return;
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
        debtRecordRepository.save(debtRecord);
    }

    private void createPtPackageIfNeeded(MemberMembership membership, Long ptUserId) {
        MembershipPlan plan = membership.getPlan();
        if (plan.getPlanType() != PlanType.PT) {
            return;
        }

        PtSessionPackage sessionPackage = new PtSessionPackage();
        sessionPackage.setMember(membership.getMember());
        sessionPackage.setPtUser(findUserOrNull(ptUserId));
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

    private User currentUserOrNull() {
        return SecurityUtils.currentUserIdOrNull() == null ? null : findUserOrNull(SecurityUtils.currentUserIdOrNull());
    }

    private User findUserOrNull(Long id) {
        if (id == null) {
            return null;
        }
        return userRepository.findById(id).orElse(null);
    }
}
