package com.gymduongdouble.backend.common.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.security.jwt")
public record JwtProperties(
    String secret,
    long accessTokenMinutes
) {
}
