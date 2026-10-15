package com.gymduongdouble.backend.pt.service;

import com.gymduongdouble.backend.common.enums.PlanType;
import com.gymduongdouble.backend.common.enums.PtAssignmentStatus;
import com.gymduongdouble.backend.membership.service.MembershipLifecyclePolicy;
import com.gymduongdouble.backend.pt.domain.PtAssignment;
import com.gymduongdouble.backend.pt.repository.PtAssignmentRepository;
import com.gymduongdouble.backend.pt.repository.PtSessionPackageRepository;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PtAssignmentPolicy {

    private final PtAssignmentRepository ptAssignmentRepository;
    private final PtSessionPackageRepository ptSessionPackageRepository;
    private final MembershipLifecyclePolicy membershipLifecyclePolicy;

    public boolean hasEffectiveAssignment(Long memberId, Long ptUserId, LocalDate date) {
        return ptAssignmentRepository.findByMemberId(memberId).stream()
            .anyMatch(assignment -> assignment.getPtUser().getId().equals(ptUserId) && isEffective(assignment, date));
    }

    public boolean hasEffectiveAssignment(Long memberId, LocalDate date) {
        return ptAssignmentRepository.findByMemberId(memberId).stream()
            .anyMatch(assignment -> isEffective(assignment, date));
    }

    public boolean canAccessMember(Long memberId, Long ptUserId, LocalDate date) {
        List<PtAssignment> assignments = ptAssignmentRepository.findByMemberId(memberId);
        if (!hasAccessiblePtPackage(memberId, ptUserId, date)) {
            return false;
        }
        return assignments.isEmpty() || assignments.stream()
            .anyMatch(assignment -> assignment.getPtUser().getId().equals(ptUserId) && isEffective(assignment, date));
    }

    public boolean hasAccessiblePtPackage(Long memberId, Long ptUserId, LocalDate date) {
        return ptSessionPackageRepository.findByMemberIdOrderByStartDateDesc(memberId).stream()
            .anyMatch(sessionPackage -> membershipLifecyclePolicy.isEffective(sessionPackage, date)
                && sessionPackage.getMembership().getPlan().getPlanType() == PlanType.PT
                && (sessionPackage.getPtUser() == null || sessionPackage.getPtUser().getId().equals(ptUserId))
            );
    }

    public boolean isEffective(PtAssignment assignment, LocalDate date) {
        return effectiveStatus(assignment, date) == PtAssignmentStatus.ACTIVE
            && !assignment.getStartDate().isAfter(date)
            && (assignment.getEndDate() == null || !assignment.getEndDate().isBefore(date));
    }

    public PtAssignmentStatus effectiveStatus(PtAssignment assignment, LocalDate date) {
        if (assignment.getStatus() != PtAssignmentStatus.ACTIVE) {
            return assignment.getStatus();
        }
        LocalDate endDate = assignment.getEndDate() == null ? inferredEndDate(assignment) : assignment.getEndDate();
        return endDate != null && endDate.isBefore(date)
            ? PtAssignmentStatus.ENDED
            : PtAssignmentStatus.ACTIVE;
    }

    private LocalDate inferredEndDate(PtAssignment assignment) {
        return ptSessionPackageRepository.findByMemberIdOrderByStartDateDesc(assignment.getMember().getId()).stream()
            .filter(sessionPackage -> sessionPackage.getPtUser() != null
                && sessionPackage.getPtUser().getId().equals(assignment.getPtUser().getId()))
            .filter(sessionPackage -> !sessionPackage.getStartDate().isAfter(assignment.getStartDate()))
            .filter(sessionPackage -> !sessionPackage.getEndDate().isBefore(assignment.getStartDate()))
            .map(sessionPackage -> sessionPackage.getEndDate())
            .max(LocalDate::compareTo)
            .orElse(null);
    }
}
