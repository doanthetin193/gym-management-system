package com.gymduongdouble.backend.membership.web.dto;

import com.gymduongdouble.backend.common.enums.PlanType;
import com.gymduongdouble.backend.common.enums.PtLevel;
import com.gymduongdouble.backend.membership.domain.MembershipPlan;
import java.math.BigDecimal;

public record MembershipPlanResponse(
    Long id,
    String name,
    PlanType planType,
    PtLevel ptLevel,
    Integer durationDays,
    BigDecimal defaultPrice,
    Integer ptSessionCount,
    Integer practiceSessionCount,
    Integer guidanceSessionCount,
    String description,
    boolean active
) {

    public static MembershipPlanResponse from(MembershipPlan plan) {
        return new MembershipPlanResponse(
            plan.getId(),
            plan.getName(),
            plan.getPlanType(),
            plan.getPtLevel(),
            plan.getDurationDays(),
            plan.getDefaultPrice(),
            plan.getPtSessionCount(),
            plan.getPracticeSessionCount(),
            plan.getGuidanceSessionCount(),
            plan.getDescription(),
            plan.isActive()
        );
    }
}
