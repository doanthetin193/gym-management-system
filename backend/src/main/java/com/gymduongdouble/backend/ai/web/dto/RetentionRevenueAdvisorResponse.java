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

    public record AdvisorInsight(
        String healthStatus,
        String overview,
        List<String> topRisks,
        List<String> revenueOpportunities,
        List<String> actionPlan7Days,
        List<String> trackingMetrics,
        String revenueRiskNote,
        String providerMessage
    ) {
    }
}
