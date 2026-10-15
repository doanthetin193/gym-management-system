package com.gymduongdouble.backend.dashboard.web.dto;

import java.math.BigDecimal;

public record OwnerDashboardResponse(
    long totalMembers,
    long activeMembers,
    long expiringSoon,
    long expired,
    long newMembersThisMonth,
    long renewedMembersThisMonth,
    BigDecimal monthlyIncome,
    BigDecimal totalDebt,
    long unreadNotifications
) {
}
