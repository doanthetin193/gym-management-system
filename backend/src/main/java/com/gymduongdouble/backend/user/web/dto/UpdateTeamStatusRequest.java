package com.gymduongdouble.backend.user.web.dto;

import com.gymduongdouble.backend.common.enums.UserStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateTeamStatusRequest(
    @NotNull(message = "Trạng thái tài khoản không được để trống")
    UserStatus status
) {
}
