package com.gymduongdouble.backend.pt.web.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record PtAssignmentRequest(
    @NotNull(message = "PT phụ trách là bắt buộc.")
    Long ptUserId,

    @NotNull(message = "Khách hàng là bắt buộc.")
    Long memberId,

    @NotNull(message = "Ngày bắt đầu là bắt buộc.")
    LocalDate startDate,

    LocalDate endDate,
    String note
) {
}
