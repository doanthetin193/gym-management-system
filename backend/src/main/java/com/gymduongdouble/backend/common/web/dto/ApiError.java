package com.gymduongdouble.backend.common.web.dto;

import java.util.Map;

public record ApiError(
    String code,
    String message,
    Map<String, String> fields
) {

    public static ApiError of(String code, String message) {
        return new ApiError(code, message, Map.of());
    }

    public static ApiError withFields(String code, String message, Map<String, String> fields) {
        return new ApiError(code, message, fields);
    }
}
