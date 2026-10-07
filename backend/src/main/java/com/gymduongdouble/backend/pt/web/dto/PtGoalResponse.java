package com.gymduongdouble.backend.pt.web.dto;

import com.gymduongdouble.backend.common.enums.GoalType;
import com.gymduongdouble.backend.common.enums.ProgramStatus;
import com.gymduongdouble.backend.training.domain.PtGoal;
import java.math.BigDecimal;
import java.time.LocalDate;

public record PtGoalResponse(
    Long id,
    Long memberId,
    String memberName,
    Long ptUserId,
    String ptFullName,
    GoalType goalType,
    String goalDescription,
    LocalDate startDate,
    LocalDate targetDate,
    BigDecimal targetWeight,
    BigDecimal targetBodyFat,
    BigDecimal targetWaist,
    ProgramStatus status,
    String note
) {

    public static PtGoalResponse from(PtGoal goal) {
        return new PtGoalResponse(
            goal.getId(),
            goal.getMember().getId(),
            goal.getMember().getFullName(),
            goal.getPtUser() == null ? null : goal.getPtUser().getId(),
            goal.getPtUser() == null ? null : goal.getPtUser().getFullName(),
            goal.getGoalType(),
            goal.getGoalDescription(),
            goal.getStartDate(),
            goal.getTargetDate(),
            goal.getTargetWeight(),
            goal.getTargetBodyFat(),
            goal.getTargetWaist(),
            goal.getStatus(),
            goal.getNote()
        );
    }
}
