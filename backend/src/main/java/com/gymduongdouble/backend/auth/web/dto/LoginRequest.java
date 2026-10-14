package com.gymduongdouble.backend.auth.web.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
    @NotBlank(message = "Email hoặc số điện thoại là bắt buộc.")
    String email,

    @NotBlank(message = "Mật khẩu là bắt buộc.")
    String password,

    Boolean rememberMe
) {
    @Override
    public String toString() {
        return "LoginRequest[email=%s, password=***, rememberMe=%s]".formatted(email, rememberMe);
    }
}
