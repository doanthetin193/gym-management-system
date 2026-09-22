package com.gymduongdouble.backend.common.web.dto;

import java.time.Instant;

public record ApiResponse<T>(
    boolean success,
    String message,
    T data,
    ApiError error,
    Instant timestamp
) {

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, "OK", data, null, Instant.now());
    }

    public static <T> ApiResponse<T> created(T data) {
        return new ApiResponse<>(true, "CREATED", data, null, Instant.now());
    }

    public static <T> ApiResponse<T> fail(String message, ApiError error) {
        return new ApiResponse<>(false, message, null, error, Instant.now());
    }
}
