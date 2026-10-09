package com.gymduongdouble.backend.member.service;

import com.gymduongdouble.backend.common.enums.PtAssignmentStatus;
import com.gymduongdouble.backend.common.security.AuthenticatedUser;
import com.gymduongdouble.backend.common.security.SecurityUtils;
import com.gymduongdouble.backend.common.time.AppClock;
import com.gymduongdouble.backend.pt.domain.PtAssignment;
import com.gymduongdouble.backend.pt.repository.PtAssignmentRepository;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MemberAccessService {

    private final PtAssignmentRepository ptAssignmentRepository;

    public boolean canAccessMember(Long memberId) {
        if (hasRole("OWNER")) {
            return true;
        }
        Long currentUserId = SecurityUtils.currentUserIdOrNull();
        if (currentUserId == null || !hasRole("PT")) {
            return false;
        }

        var activeAssignments = ptAssignmentRepository.findByMemberId(memberId).stream()
            .filter(this::isActive)
            .toList();
        return activeAssignments.isEmpty() || activeAssignments.stream()
            .anyMatch(assignment -> assignment.getPtUser().getId().equals(currentUserId));
    }

    public void ensureCanAccessMember(Long memberId) {
        if (!canAccessMember(memberId)) {
            throw new AccessDeniedException("PT chỉ được thao tác với khách chưa có PT hoặc khách được phân công cho chính mình.");
        }
    }

    private boolean hasRole(String roleCode) {
        return SecurityUtils.currentUser()
            .stream()
            .map(AuthenticatedUser::getAuthorities)
            .flatMap(authorities -> authorities.stream())
            .anyMatch(authority -> authority.getAuthority().equals("ROLE_" + roleCode));
    }

    private boolean isActive(PtAssignment assignment) {
        LocalDate today = AppClock.today();
        return assignment.getStatus() == PtAssignmentStatus.ACTIVE
            && (assignment.getEndDate() == null || !assignment.getEndDate().isBefore(today));
    }
}
