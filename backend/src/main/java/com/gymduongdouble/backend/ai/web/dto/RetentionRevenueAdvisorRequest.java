package com.gymduongdouble.backend.ai.web.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record RetentionRevenueAdvisorRequest(
    @Min(2020)
    @Max(2100)
    Integer year,

    @Min(1)
    @Max(12)
    Integer month
) {
}
