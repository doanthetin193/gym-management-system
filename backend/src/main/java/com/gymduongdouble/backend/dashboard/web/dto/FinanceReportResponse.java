package com.gymduongdouble.backend.dashboard.web.dto;

import java.math.BigDecimal;
import java.util.List;

public record FinanceReportResponse(
    Integer year,
    Integer month,
    BigDecimal totalIncome,
    BigDecimal totalExpense,
    BigDecimal profit,
    List<FinanceReportRowResponse> rows
) {
}
