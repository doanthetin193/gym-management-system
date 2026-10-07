package com.gymduongdouble.backend.dashboard.web.dto;

import java.math.BigDecimal;

public record FinanceReportRowResponse(
    Integer month,
    BigDecimal income,
    BigDecimal expense,
    BigDecimal profit
) {
}
