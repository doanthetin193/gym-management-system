package com.gymduongdouble.backend.membership.web.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateMembershipPlanActiveRequest(
    @NotNull(message = "Trạng thái gói là bắt buộc.")
    Boolean active
) {
}
