package com.gymduongdouble.backend.finance.web.dto;

import java.math.BigDecimal;

public record FinanceSummaryResponse(
    long openDebtCount,
    BigDecimal totalOpenDebt,
    BigDecimal paidToday
) {
}
