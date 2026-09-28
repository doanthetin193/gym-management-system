package com.gymduongdouble.backend.member.web.dto;

import com.gymduongdouble.backend.membership.web.dto.MemberMembershipResponse;
import java.math.BigDecimal;
import java.util.List;

public record MemberDetailResponse(
    MemberResponse profile,
    List<MemberMembershipResponse> activeMemberships,
    List<MemberMembershipResponse> membershipHistory,
    List<PtSessionPackageResponse> ptSessionPackages,
    BigDecimal totalDebt
) {
}
