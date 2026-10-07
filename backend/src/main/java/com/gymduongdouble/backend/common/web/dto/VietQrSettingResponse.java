package com.gymduongdouble.backend.common.web.dto;

public record VietQrSettingResponse(
    boolean enabled,
    String bankCode,
    String bankName,
    String accountNumber,
    String accountName,
    String transferPrefix,
    String template
) {
}
