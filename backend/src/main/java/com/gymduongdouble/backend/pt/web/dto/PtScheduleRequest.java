package com.gymduongdouble.backend.pt.web.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;

public record PtScheduleRequest(
    @NotNull(message = "PT phụ trách là bắt buộc.")
    Long ptUserId,

    Long memberId,

    @NotNull(message = "Ngày dạy là bắt buộc.")
    LocalDate scheduleDate,

    @NotNull(message = "Giờ bắt đầu là bắt buộc.")
    LocalTime startTime,

    LocalTime endTime,
    String note
) {
}
