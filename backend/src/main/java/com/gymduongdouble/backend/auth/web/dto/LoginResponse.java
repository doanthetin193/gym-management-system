package com.gymduongdouble.backend.auth.web.dto;

public record LoginResponse(
    String tokenType,
    String accessToken,
    long expiresInMinutes,
    AuthUserResponse user
) {
    @Override
    public String toString() {
        return "LoginResponse[tokenType=%s, accessToken=***, expiresInMinutes=%d, user=%s]"
            .formatted(tokenType, expiresInMinutes, user);
    }
}
