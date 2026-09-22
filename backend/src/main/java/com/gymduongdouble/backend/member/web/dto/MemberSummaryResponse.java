package com.gymduongdouble.backend.member.web.dto;

import com.gymduongdouble.backend.common.enums.MembershipStatus;
import com.gymduongdouble.backend.common.enums.MemberStatus;
import com.gymduongdouble.backend.member.domain.Member;
import com.gymduongdouble.backend.membership.domain.MemberMembership;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

public record MemberSummaryResponse(
    Long id,
    String fullName,
    String phone,
    LocalDate dateOfBirth,
    MemberStatus status,
    Long currentMembershipId,
    String currentPlanName,
    MembershipStatus currentMembershipStatus,
    LocalDate endDate,
    Long daysUntilExpiration
) {

    public static MemberSummaryResponse from(Member member, MemberMembership membership) {
        Long daysUntilExpiration = membership == null
            ? null
            : ChronoUnit.DAYS.between(LocalDate.now(), membership.getEndDate());

        return new MemberSummaryResponse(
            member.getId(),
            member.getFullName(),
            member.getPhone(),
            member.getDateOfBirth(),
            member.getStatus(),
            membership == null ? null : membership.getId(),
            membership == null ? null : membership.getPlan().getName(),
            membership == null ? null : membership.getStatus(),
            membership == null ? null : membership.getEndDate(),
            daysUntilExpiration
        );
    }
}
