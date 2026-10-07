package com.gymduongdouble.backend.member.web.dto;

import com.gymduongdouble.backend.finance.web.dto.DebtRecordResponse;
import com.gymduongdouble.backend.finance.web.dto.PaymentResponse;
import com.gymduongdouble.backend.membership.web.dto.MemberMembershipResponse;
import com.gymduongdouble.backend.pt.web.dto.BodyMeasurementResponse;
import com.gymduongdouble.backend.pt.web.dto.PtGoalResponse;
import com.gymduongdouble.backend.pt.web.dto.PtScheduleResponse;
import com.gymduongdouble.backend.pt.web.dto.PtSessionLogResponse;
import java.math.BigDecimal;
import java.util.List;

public record MemberPortalResponse(
    MemberResponse profile,
    List<MemberMembershipResponse> activeMemberships,
    List<MemberMembershipResponse> membershipHistory,
    List<PtSessionPackageResponse> ptSessionPackages,
    List<DebtRecordResponse> debts,
    List<PaymentResponse> payments,
    List<PtScheduleResponse> schedules,
    List<PtSessionLogResponse> sessionLogs,
    List<BodyMeasurementResponse> bodyMeasurements,
    List<PtGoalResponse> goals,
    BigDecimal totalDebt
) {
}
