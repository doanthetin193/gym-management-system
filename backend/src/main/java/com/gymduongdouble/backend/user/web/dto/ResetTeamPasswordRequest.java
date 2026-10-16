package com.gymduongdouble.backend.user.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetTeamPasswordRequest(
    @NotBlank(message = "Mật khẩu mới không được để trống")
    @Size(min = 8, message = "Mật khẩu tối thiểu 8 ký tự")
    String newPassword
) {
    @Override
    public String toString() {
        return "ResetTeamPasswordRequest[newPassword=***]";
    }
}
