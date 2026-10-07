package com.gymduongdouble.backend.dashboard.web.dto;

import com.gymduongdouble.backend.common.enums.BusinessGoalCategory;
import com.gymduongdouble.backend.common.enums.BusinessGoalMetric;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record BusinessGoalRequest(
    @NotNull(message = "Năm không được để trống.")
    @Min(value = 2020, message = "Năm không hợp lệ.")
    Integer year,

    @NotNull(message = "Tháng không được để trống.")
    @Min(value = 1, message = "Tháng phải từ 1 đến 12.")
    @Max(value = 12, message = "Tháng phải từ 1 đến 12.")
    Integer month,

    @NotNull(message = "Nhóm mục tiêu không được để trống.")
    BusinessGoalCategory category,

    @NotNull(message = "Chỉ số mục tiêu không được để trống.")
    BusinessGoalMetric metricName,

    @NotNull(message = "Giá trị mục tiêu không được để trống.")
    BigDecimal targetValue,

    BigDecimal actualValueOverride,
    String unit,
    String note
) {
}
