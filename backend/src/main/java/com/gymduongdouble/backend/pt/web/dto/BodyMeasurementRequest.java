package com.gymduongdouble.backend.pt.web.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public record BodyMeasurementRequest(
    @NotNull(message = "Ngày đo là bắt buộc.")
    LocalDate recordedAt,

    BigDecimal height,
    BigDecimal weight,
    BigDecimal chest,
    BigDecimal waist,
    BigDecimal abdomen,
    BigDecimal hip,
    BigDecimal thigh,
    BigDecimal arm,
    String note
) {
}
