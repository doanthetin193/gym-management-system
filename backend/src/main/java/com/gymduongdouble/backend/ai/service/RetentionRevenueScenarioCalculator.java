package com.gymduongdouble.backend.ai.service;

import com.gymduongdouble.backend.ai.web.dto.RetentionRevenueAdvisorRequest.AdvisorScenarioRequest;
import com.gymduongdouble.backend.ai.web.dto.RetentionRevenueAdvisorResponse.ScenarioProjection;
import java.math.BigDecimal;
import java.math.RoundingMode;

final class RetentionRevenueScenarioCalculator {

    private RetentionRevenueScenarioCalculator() {
    }

    static ScenarioProjection calculate(
        AdvisorScenarioRequest scenario,
        long debtCollectionPotential,
        long ptRecoveryPotential,
        long renewalOpportunityPotential
    ) {
        long estimatedDebtCollection = percentageOf(debtCollectionPotential, scenario.debtCollectionPercent());
        long estimatedPtRecoveryValue = percentageOf(ptRecoveryPotential, scenario.ptRecoveryPercent());
        long estimatedRenewalValue = percentageOf(renewalOpportunityPotential, scenario.renewalConversionPercent());

        return new ScenarioProjection(
            scenario.debtCollectionPercent(),
            scenario.ptRecoveryPercent(),
            scenario.renewalConversionPercent(),
            debtCollectionPotential,
            ptRecoveryPotential,
            renewalOpportunityPotential,
            estimatedDebtCollection,
            estimatedPtRecoveryValue,
            estimatedRenewalValue,
            estimatedDebtCollection + estimatedPtRecoveryValue + estimatedRenewalValue
        );
    }

    private static long percentageOf(long amount, int percent) {
        return BigDecimal.valueOf(Math.max(0, amount))
            .multiply(BigDecimal.valueOf(percent))
            .movePointLeft(2)
            .setScale(0, RoundingMode.HALF_UP)
            .longValue();
    }
}
