package com.gymduongdouble.backend.pt.web.dto;

import com.gymduongdouble.backend.common.enums.GoalType;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public record PtGoalRequest(
    Long ptUserId,

    @NotNull(message = "Loại mục tiêu là bắt buộc.")
    GoalType goalType,

    String goalDescription,
    LocalDate startDate,
    LocalDate targetDate,
    BigDecimal targetWeight,
    BigDecimal targetBodyFat,
    BigDecimal targetWaist,
    String note
) {
}
