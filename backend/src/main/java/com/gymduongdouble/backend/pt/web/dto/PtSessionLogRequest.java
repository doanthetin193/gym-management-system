package com.gymduongdouble.backend.pt.web.dto;

import com.gymduongdouble.backend.common.enums.PtSessionStatus;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public record PtSessionLogRequest(
    @NotNull(message = "Gói buổi PT là bắt buộc.")
    Long sessionPackageId,

    Long scheduleId,

    @NotNull(message = "Ngày tập là bắt buộc.")
    LocalDate sessionDate,

    Integer sessionNumber,
    BigDecimal weight,
    PtSessionStatus status,
    String content,
    String note
) {
}
