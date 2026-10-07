package com.gymduongdouble.backend.dashboard.web.dto;

import com.gymduongdouble.backend.common.enums.BusinessGoalCategory;
import com.gymduongdouble.backend.common.enums.BusinessGoalMetric;
import java.math.BigDecimal;

public record BusinessGoalProgressItemResponse(
    Long goalId,
    BusinessGoalCategory category,
    BusinessGoalMetric metricName,
    BigDecimal targetValue,
    BigDecimal actualValue,
    BigDecimal progressPercent,
    String unit,
    String note,
    boolean manualActual
) {
}
