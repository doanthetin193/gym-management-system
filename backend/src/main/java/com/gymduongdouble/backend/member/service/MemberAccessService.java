package com.gymduongdouble.backend.member.service;

import com.gymduongdouble.backend.common.security.AuthenticatedUser;
import com.gymduongdouble.backend.common.security.SecurityUtils;
import com.gymduongdouble.backend.common.time.AppClock;
import com.gymduongdouble.backend.common.enums.PlanType;
import com.gymduongdouble.backend.common.enums.MemberStatus;
import com.gymduongdouble.backend.member.repository.MemberRepository;
import com.gymduongdouble.backend.pt.service.PtAssignmentPolicy;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MemberAccessService {

    private final MemberRepository memberRepository;
    private final PtAssignmentPolicy ptAssignmentPolicy;

    public boolean canAccessMember(Long memberId) {
        if (hasRole("OWNER")) {
            return true;
        }
        Long currentUserId = SecurityUtils.currentUserIdOrNull();
        if (currentUserId == null || !hasRole("PT")) {
            return false;
        }
        return memberRepository.findById(memberId)
            .filter(member -> member.getStatus() == MemberStatus.ACTIVE)
            .map(member -> ptAssignmentPolicy.canAccessMember(memberId, currentUserId, AppClock.today()))
            .orElse(false);
    }

    public void ensureCanAccessMember(Long memberId) {
        if (!canAccessMember(memberId)) {
            throw new AccessDeniedException("PT chỉ được thao tác với khách chưa có PT hoặc khách được phân công cho chính mình.");
        }
    }

    public void ensureCanCreateMembership(Long memberId, PlanType planType) {
        if (canAccessMember(memberId)) {
            return;
        }
        boolean canStartPtEnrollment = planType == PlanType.PT
            && hasRole("PT")
            && memberRepository.findById(memberId)
                .filter(member -> member.getStatus() == MemberStatus.ACTIVE)
                .map(member -> !ptAssignmentPolicy.hasEffectiveAssignment(memberId, AppClock.today()))
                .orElse(false);
        if (!canStartPtEnrollment) {
            throw new AccessDeniedException("PT chỉ có thể đăng ký gói PT cho khách chưa được phân công hoặc khách do mình phụ trách.");
        }
    }

    private boolean hasRole(String roleCode) {
        return SecurityUtils.currentUser()
            .stream()
            .map(AuthenticatedUser::getAuthorities)
            .flatMap(authorities -> authorities.stream())
            .anyMatch(authority -> authority.getAuthority().equals("ROLE_" + roleCode));
    }

}
