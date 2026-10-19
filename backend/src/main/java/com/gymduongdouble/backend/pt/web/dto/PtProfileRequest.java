package com.gymduongdouble.backend.pt.web.dto;

import com.gymduongdouble.backend.common.enums.PtLevel;
import jakarta.validation.constraints.NotNull;

public record PtProfileRequest(
    @NotNull(message = "User PT là bắt buộc.")
    Long userId,

    @NotNull(message = "Cấp PT là bắt buộc.")
    PtLevel ptLevel,

    String specialty,
    String bio,
    Boolean active
) {
}
