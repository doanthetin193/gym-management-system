package com.gymduongdouble.backend.dashboard.web.dto;

import java.math.BigDecimal;
import java.util.List;

public record FinanceReportResponse(
    Integer year,
    Integer month,
    BigDecimal totalIncome,
    List<FinanceReportRowResponse> rows
) {
}
