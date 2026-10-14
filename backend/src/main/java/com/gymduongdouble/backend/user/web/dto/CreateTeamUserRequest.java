package com.gymduongdouble.backend.user.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateTeamUserRequest(
    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    String email,

    @NotBlank(message = "Tên hiển thị không được để trống")
    String fullName,

    String phone,

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 6, message = "Mật khẩu tối thiểu 6 ký tự")
    String password,

    @NotBlank(message = "Vai trò không được để trống")
    String roleCode
) {
    @Override
    public String toString() {
        return "CreateTeamUserRequest[email=%s, fullName=%s, phone=%s, password=***, roleCode=%s]"
            .formatted(email, fullName, phone, roleCode);
    }
}
