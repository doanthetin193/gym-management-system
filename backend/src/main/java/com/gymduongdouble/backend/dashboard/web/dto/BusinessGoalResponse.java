package com.gymduongdouble.backend.dashboard.web.dto;

import com.gymduongdouble.backend.common.enums.BusinessGoalCategory;
import com.gymduongdouble.backend.common.enums.BusinessGoalMetric;
import com.gymduongdouble.backend.dashboard.domain.BusinessGoal;
import java.math.BigDecimal;

public record BusinessGoalResponse(
    Long id,
    Integer year,
    Integer month,
    BusinessGoalCategory category,
    BusinessGoalMetric metricName,
    BigDecimal targetValue,
    BigDecimal actualValueOverride,
    String unit,
    String note
) {

    public static BusinessGoalResponse from(BusinessGoal goal) {
        return new BusinessGoalResponse(
            goal.getId(),
            goal.getYear(),
            goal.getMonth(),
            goal.getCategory(),
            goal.getMetricName(),
            goal.getTargetValue(),
            goal.getActualValueOverride(),
            goal.getUnit(),
            goal.getNote()
        );
    }
}
