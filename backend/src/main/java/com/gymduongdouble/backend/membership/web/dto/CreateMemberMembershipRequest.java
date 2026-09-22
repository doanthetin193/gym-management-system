package com.gymduongdouble.backend.membership.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateMemberMembershipRequest(
    @NotNull(message = "Gói tập là bắt buộc.")
    Long planId,

    Long soldByUserId,
    Long ptUserId,

    @NotNull(message = "Ngày bắt đầu là bắt buộc.")
    LocalDate startDate,

    LocalDate endDate,

    @DecimalMin(value = "0.0", message = "Giá bán không được âm.")
    BigDecimal actualPrice,

    @DecimalMin(value = "0.0", message = "Giảm giá không được âm.")
    BigDecimal discountAmount,

    String note
) {
}
