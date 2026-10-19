package com.gymduongdouble.backend.ai.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.gymduongdouble.backend.ai.web.dto.RetentionRevenueAdvisorRequest.AdvisorScenarioRequest;
import org.junit.jupiter.api.Test;

class RetentionRevenueScenarioCalculatorTests {

    @Test
    void calculatesEachIndependentOpportunityAndRoundsToWholeDong() {
        var scenario = new AdvisorScenarioRequest(50, 40, 25);

        var result = RetentionRevenueScenarioCalculator.calculate(
            scenario,
            13_200_000,
            9_900_000,
            3_010_001
        );

        assertEquals(6_600_000, result.estimatedDebtCollection());
        assertEquals(3_960_000, result.estimatedPtRecoveryValue());
        assertEquals(752_500, result.estimatedRenewalValue());
        assertEquals(11_312_500, result.estimatedTotalImpact());
        assertEquals(13_200_000, result.debtCollectionPotential());
        assertEquals(9_900_000, result.ptRecoveryPotential());
        assertEquals(3_010_001, result.renewalOpportunityPotential());
    }
}
