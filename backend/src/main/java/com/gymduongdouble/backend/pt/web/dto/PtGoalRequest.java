package com.gymduongdouble.backend.pt.web.dto;

import com.gymduongdouble.backend.common.enums.GoalType;
import jakarta.validation.constraints.DecimalMin;
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

    @DecimalMin(value = "0.0", inclusive = false, message = "Cân nặng mục tiêu phải lớn hơn 0.")
    BigDecimal targetWeight,

    @DecimalMin(value = "0.0", inclusive = false, message = "Tỷ lệ mỡ mục tiêu phải lớn hơn 0.")
    BigDecimal targetBodyFat,

    @DecimalMin(value = "0.0", inclusive = false, message = "Vòng eo mục tiêu phải lớn hơn 0.")
    BigDecimal targetWaist,

    String note
) {
}
