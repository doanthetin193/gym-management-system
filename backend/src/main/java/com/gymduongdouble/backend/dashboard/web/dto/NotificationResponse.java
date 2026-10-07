package com.gymduongdouble.backend.dashboard.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record NotificationResponse(
    String id,
    String type,
    String title,
    String message,
    Long memberId,
    String memberName,
    LocalDate dueDate,
    BigDecimal amount,
    boolean read
) {
}
