package com.gymduongdouble.backend.auth.web.dto;

public record LoginResponse(
    String tokenType,
    String accessToken,
    long expiresInMinutes,
    AuthUserResponse user
) {
}
