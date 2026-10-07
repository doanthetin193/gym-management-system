package com.gymduongdouble.backend.user.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetTeamPasswordRequest(
    @NotBlank(message = "Mật khẩu mới không được để trống")
    @Size(min = 6, message = "Mật khẩu tối thiểu 6 ký tự")
    String newPassword
) {
}
