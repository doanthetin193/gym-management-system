package com.gymduongdouble.backend.finance.web.dto;

import com.gymduongdouble.backend.common.enums.PaymentMethod;
import com.gymduongdouble.backend.common.enums.RevenueCategory;
import com.gymduongdouble.backend.finance.domain.Payment;
import java.math.BigDecimal;
import java.time.LocalDate;

public record PaymentResponse(
    Long id,
    Long memberId,
    String memberName,
    Long membershipId,
    LocalDate paymentDate,
    BigDecimal amount,
    PaymentMethod paymentMethod,
    RevenueCategory revenueCategory,
    String description
) {

    public static PaymentResponse from(Payment payment) {
        return new PaymentResponse(
            payment.getId(),
            payment.getMember().getId(),
            payment.getMember().getFullName(),
            payment.getMembership() == null ? null : payment.getMembership().getId(),
            payment.getPaymentDate(),
            payment.getAmount(),
            payment.getPaymentMethod(),
            payment.getRevenueCategory(),
            payment.getDescription()
        );
    }
}
