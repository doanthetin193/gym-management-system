package com.gymduongdouble.backend.member.service;

import com.gymduongdouble.backend.common.enums.DebtStatus;
import com.gymduongdouble.backend.common.enums.MemberStatus;
import com.gymduongdouble.backend.common.exception.ResourceNotFoundException;
import com.gymduongdouble.backend.common.time.AppClock;
import com.gymduongdouble.backend.finance.domain.DebtRecord;
import com.gymduongdouble.backend.finance.repository.DebtRecordRepository;
import com.gymduongdouble.backend.finance.repository.PaymentRepository;
import com.gymduongdouble.backend.finance.web.dto.DebtRecordResponse;
import com.gymduongdouble.backend.finance.web.dto.PaymentResponse;
import com.gymduongdouble.backend.member.domain.Member;
import com.gymduongdouble.backend.member.repository.MemberRepository;
import com.gymduongdouble.backend.member.web.dto.MemberPortalResponse;
import com.gymduongdouble.backend.member.web.dto.MemberResponse;
import com.gymduongdouble.backend.member.web.dto.PtSessionPackageResponse;
import com.gymduongdouble.backend.membership.domain.MemberMembership;
import com.gymduongdouble.backend.membership.repository.MemberMembershipRepository;
import com.gymduongdouble.backend.membership.service.MembershipLifecyclePolicy;
import com.gymduongdouble.backend.membership.web.dto.MemberMembershipResponse;
import com.gymduongdouble.backend.pt.repository.PtScheduleRepository;
import com.gymduongdouble.backend.pt.repository.PtSessionLogRepository;
import com.gymduongdouble.backend.pt.repository.PtSessionPackageRepository;
import com.gymduongdouble.backend.pt.web.dto.BodyMeasurementResponse;
import com.gymduongdouble.backend.pt.web.dto.PtGoalResponse;
import com.gymduongdouble.backend.pt.web.dto.PtScheduleResponse;
import com.gymduongdouble.backend.pt.web.dto.PtSessionLogResponse;
import com.gymduongdouble.backend.training.repository.BodyMeasurementRepository;
import com.gymduongdouble.backend.training.repository.PtGoalRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MemberPortalService {

    private final MemberRepository memberRepository;
    private final MemberMembershipRepository memberMembershipRepository;
    private final PtSessionPackageRepository ptSessionPackageRepository;
    private final DebtRecordRepository debtRecordRepository;
    private final PaymentRepository paymentRepository;
    private final PtScheduleRepository ptScheduleRepository;
    private final PtSessionLogRepository ptSessionLogRepository;
    private final BodyMeasurementRepository bodyMeasurementRepository;
    private final PtGoalRepository ptGoalRepository;
    private final MembershipLifecyclePolicy membershipLifecyclePolicy;

    @Transactional(readOnly = true)
    public MemberPortalResponse getPortal(Long userId) {
        Member member = memberRepository.findByUserId(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Tai khoan hoi vien chua duoc lien ket voi ho so khach hang."));
        if (member.getStatus() != MemberStatus.ACTIVE) {
            throw new AccessDeniedException("Tài khoản hội viên đã ngừng hoạt động.");
        }
        Long memberId = member.getId();
        LocalDate today = AppClock.today();
        List<MemberMembership> memberships = memberMembershipRepository.findByMemberIdOrderByStartDateDesc(memberId);
        List<DebtRecord> debts = debtRecordRepository.findByMemberIdOrderByCreatedAtDesc(memberId);

        return new MemberPortalResponse(
            MemberResponse.from(member),
            memberships.stream()
                .filter(membership -> membershipLifecyclePolicy.isEffective(membership, today))
                .map(membership -> MemberMembershipResponse.from(
                    membership,
                    membershipLifecyclePolicy.effectiveStatus(membership, today)
                ))
                .toList(),
            memberships.stream()
                .filter(membership -> !membershipLifecyclePolicy.isEffective(membership, today))
                .map(membership -> MemberMembershipResponse.from(
                    membership,
                    membershipLifecyclePolicy.effectiveStatus(membership, today)
                ))
                .toList(),
            ptSessionPackageRepository.findByMemberIdOrderByStartDateDesc(memberId).stream()
                .map(sessionPackage -> PtSessionPackageResponse.from(
                    sessionPackage,
                    membershipLifecyclePolicy.effectiveStatus(sessionPackage, today)
                ))
                .toList(),
            debts.stream().map(DebtRecordResponse::from).toList(),
            paymentRepository.findByMemberIdOrderByPaymentDateDesc(memberId).stream()
                .map(PaymentResponse::from)
                .toList(),
            ptScheduleRepository.findByMemberIdOrderByScheduleDateDesc(memberId).stream()
                .map(PtScheduleResponse::from)
                .toList(),
            ptSessionLogRepository.findByMemberIdOrderBySessionDateDesc(memberId).stream()
                .map(PtSessionLogResponse::from)
                .toList(),
            bodyMeasurementRepository.findByMemberIdOrderByRecordedAtDesc(memberId).stream()
                .map(BodyMeasurementResponse::from)
                .toList(),
            ptGoalRepository.findByMemberIdOrderByCreatedAtDesc(memberId).stream()
                .map(PtGoalResponse::from)
                .toList(),
            debts.stream()
                .filter(debt -> debt.getStatus() == DebtStatus.OPEN || debt.getStatus() == DebtStatus.PARTIALLY_PAID)
                .map(DebtRecord::getRemainingAmount)
                .filter(amount -> amount.compareTo(BigDecimal.ZERO) > 0)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
        );
    }

}
