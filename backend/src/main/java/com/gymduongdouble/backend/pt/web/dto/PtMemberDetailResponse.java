package com.gymduongdouble.backend.pt.web.dto;

import com.gymduongdouble.backend.member.web.dto.MemberResponse;
import java.util.List;

public record PtMemberDetailResponse(
    MemberResponse profile,
    List<PtAssignmentResponse> assignments,
    List<PtSessionPackageSummaryResponse> sessionPackages,
    List<PtScheduleResponse> schedules,
    List<PtSessionLogResponse> sessionLogs,
    List<MemberActivityLogResponse> activityLogs,
    List<BodyMeasurementResponse> bodyMeasurements,
    List<PtGoalResponse> goals
) {
}
