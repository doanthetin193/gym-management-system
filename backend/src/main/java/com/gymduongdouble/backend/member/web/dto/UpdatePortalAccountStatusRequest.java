package com.gymduongdouble.backend.member.web.dto;

import com.gymduongdouble.backend.common.enums.UserStatus;
import jakarta.validation.constraints.NotNull;

public record UpdatePortalAccountStatusRequest(
    @NotNull(message = "Trạng thái tài khoản không được để trống")
    UserStatus status
) {
}
