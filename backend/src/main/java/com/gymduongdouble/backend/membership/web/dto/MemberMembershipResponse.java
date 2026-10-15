package com.gymduongdouble.backend.membership.web.dto;

import com.gymduongdouble.backend.common.enums.MembershipStatus;
import com.gymduongdouble.backend.membership.domain.MemberMembership;
import java.math.BigDecimal;
import java.time.LocalDate;

public record MemberMembershipResponse(
    Long id,
    Long memberId,
    String memberName,
    Long planId,
    String planName,
    LocalDate startDate,
    LocalDate endDate,
    BigDecimal actualPrice,
    BigDecimal paidAmount,
    BigDecimal discountAmount,
    BigDecimal debtAmount,
    MembershipStatus status,
    String note
) {

    public static MemberMembershipResponse from(MemberMembership membership) {
        return from(membership, membership.getStatus());
    }

    public static MemberMembershipResponse from(MemberMembership membership, MembershipStatus status) {
        return new MemberMembershipResponse(
            membership.getId(),
            membership.getMember().getId(),
            membership.getMember().getFullName(),
            membership.getPlan().getId(),
            membership.getPlan().getName(),
            membership.getStartDate(),
            membership.getEndDate(),
            membership.getActualPrice(),
            membership.getPaidAmount(),
            membership.getDiscountAmount(),
            membership.getDebtAmount(),
            status,
            membership.getNote()
        );
    }
}
