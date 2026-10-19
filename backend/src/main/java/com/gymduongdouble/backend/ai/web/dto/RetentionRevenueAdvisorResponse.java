package com.gymduongdouble.backend.ai.web.dto;

import java.time.Instant;
import java.util.List;

public record RetentionRevenueAdvisorResponse(
    Integer year,
    Integer month,
    boolean aiGenerated,
    String model,
    Instant generatedAt,
    AdvisorSummary summary,
    List<AdvisorSegment> riskSegments,
    List<AdvisorSegment> opportunitySegments,
    ScenarioProjection scenario,
    AdvisorInsight insight
) {

    public record AdvisorSummary(
        long totalMembers,
        long activeMembers,
        long expiredMembers,
        long nearExpiryMembers,
        long highRiskChurn,
        long mediumRiskChurn,
        long openDebtCount,
        long newMembersThisMonth,
        long renewalsThisMonth,
        long currentMonthRevenue,
        long previousMonthRevenue,
        long renewalOpportunityValue,
        long openDebtAmount
    ) {
    }

    public record AdvisorSegment(
        String code,
        String label,
        long count,
        long estimatedRevenueAtRisk,
        String recommendation
    ) {
    }

    public record ScenarioProjection(
        int debtCollectionPercent,
        int ptRecoveryPercent,
        int renewalConversionPercent,
        long debtCollectionPotential,
        long ptRecoveryPotential,
        long renewalOpportunityPotential,
        long estimatedDebtCollection,
        long estimatedPtRecoveryValue,
        long estimatedRenewalValue,
        long estimatedTotalImpact
    ) {
    }

    public record ScenarioInsight(
        String overview,
        List<String> priorityActions,
        List<String> cautions
    ) {
    }

    public record AdvisorInsight(
        String healthStatus,
        String overview,
        List<String> topRisks,
        List<String> revenueOpportunities,
        List<String> actionPlan7Days,
        List<String> trackingMetrics,
        String revenueRiskNote,
        ScenarioInsight scenario,
        String providerMessage
    ) {
    }
}
