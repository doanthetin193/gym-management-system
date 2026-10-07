package com.gymduongdouble.backend.pt.web.dto;

import com.gymduongdouble.backend.common.enums.PtLevel;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record PtProfileRequest(
    @NotNull(message = "User PT là bắt buộc.")
    Long userId,

    @NotNull(message = "Cấp PT là bắt buộc.")
    PtLevel ptLevel,

    String specialty,
    String bio,
    BigDecimal baseSalary,
    BigDecimal teachingRate,
    BigDecimal salesCommissionRate,
    Boolean active
) {
}
