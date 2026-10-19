package com.gymduongdouble.backend.membership.web.dto;

import com.gymduongdouble.backend.common.enums.PlanType;
import com.gymduongdouble.backend.membership.domain.MembershipPlan;
import java.math.BigDecimal;

public record PublicMembershipPlanResponse(
    Long id, String name, PlanType planType, Integer durationDays, BigDecimal price,
    Integer ptSessionCount, Integer practiceSessionCount, Integer guidanceSessionCount, String description
) {
    public static PublicMembershipPlanResponse from(MembershipPlan plan) {
        return new PublicMembershipPlanResponse(plan.getId(), plan.getName(), plan.getPlanType(),
            plan.getDurationDays(), plan.getDefaultPrice(), plan.getPtSessionCount(),
            plan.getPracticeSessionCount(), plan.getGuidanceSessionCount(), plan.getDescription());
    }
}
