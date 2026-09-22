package com.gymduongdouble.backend.finance.web.dto;

import com.gymduongdouble.backend.common.enums.PaymentMethod;
import com.gymduongdouble.backend.common.enums.RevenueCategory;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public record CreatePaymentRequest(
    @NotNull(message = "Khách hàng là bắt buộc.")
    Long memberId,

    Long membershipId,

    @NotNull(message = "Ngày thanh toán là bắt buộc.")
    LocalDate paymentDate,

    @NotNull(message = "Số tiền là bắt buộc.")
    @DecimalMin(value = "1.0", message = "Số tiền phải lớn hơn 0.")
    BigDecimal amount,

    PaymentMethod paymentMethod,
    RevenueCategory revenueCategory,
    String description
) {
}
