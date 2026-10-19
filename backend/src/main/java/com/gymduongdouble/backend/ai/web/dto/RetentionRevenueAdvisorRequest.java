package com.gymduongdouble.backend.ai.web.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.Valid;

public record RetentionRevenueAdvisorRequest(
    @Min(2020)
    @Max(2100)
    Integer year,

    @Min(1)
    @Max(12)
    Integer month,

    @Valid
    AdvisorScenarioRequest scenario
) {

    public record AdvisorScenarioRequest(
        @NotNull
        @Min(0)
        @Max(100)
        Integer debtCollectionPercent,

        @NotNull
        @Min(0)
        @Max(100)
        Integer ptRecoveryPercent,

        @NotNull
        @Min(0)
        @Max(100)
        Integer renewalConversionPercent
    ) {
    }
}
