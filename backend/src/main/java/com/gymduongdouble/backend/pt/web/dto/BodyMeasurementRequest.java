package com.gymduongdouble.backend.pt.web.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public record BodyMeasurementRequest(
    @NotNull(message = "Ngày đo là bắt buộc.")
    LocalDate recordedAt,

    @DecimalMin(value = "0.0", inclusive = false, message = "Chiều cao phải lớn hơn 0.")
    BigDecimal height,

    @DecimalMin(value = "0.0", inclusive = false, message = "Cân nặng phải lớn hơn 0.")
    BigDecimal weight,

    @DecimalMin(value = "0.0", inclusive = false, message = "Vòng ngực phải lớn hơn 0.")
    BigDecimal chest,

    @DecimalMin(value = "0.0", inclusive = false, message = "Vòng eo phải lớn hơn 0.")
    BigDecimal waist,

    @DecimalMin(value = "0.0", inclusive = false, message = "Vòng bụng phải lớn hơn 0.")
    BigDecimal abdomen,

    @DecimalMin(value = "0.0", inclusive = false, message = "Vòng mông phải lớn hơn 0.")
    BigDecimal hip,

    @DecimalMin(value = "0.0", inclusive = false, message = "Vòng đùi phải lớn hơn 0.")
    BigDecimal thigh,

    @DecimalMin(value = "0.0", inclusive = false, message = "Vòng tay phải lớn hơn 0.")
    BigDecimal arm,

    String note
) {
    @AssertTrue(message = "Cần nhập ít nhất một chỉ số cơ thể.")
    public boolean hasMeasurement() {
        return height != null || weight != null || chest != null || waist != null || abdomen != null
            || hip != null || thigh != null || arm != null;
    }
}
