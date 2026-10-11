package com.gymduongdouble.backend.pt.web.dto;

import com.gymduongdouble.backend.common.enums.PtSessionStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.LocalDate;

public record PtSessionLogRequest(
    @NotNull(message = "Gói buổi PT là bắt buộc.")
    Long sessionPackageId,

    Long scheduleId,

    @NotNull(message = "Ngày tập là bắt buộc.")
    LocalDate sessionDate,

    @Positive(message = "Số thứ tự buổi tập phải lớn hơn 0.")
    Integer sessionNumber,

    @DecimalMin(value = "0.0", inclusive = false, message = "Cân nặng phải lớn hơn 0.")
    BigDecimal weight,

    PtSessionStatus status,
    String content,
    String note
) {
}
