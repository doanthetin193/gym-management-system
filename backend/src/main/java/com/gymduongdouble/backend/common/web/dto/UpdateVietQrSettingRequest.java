package com.gymduongdouble.backend.common.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateVietQrSettingRequest(
    Boolean enabled,

    @NotBlank(message = "Mã ngân hàng là bắt buộc.")
    @Size(max = 40, message = "Mã ngân hàng không được quá 40 ký tự.")
    String bankCode,

    @NotBlank(message = "Tên ngân hàng là bắt buộc.")
    @Size(max = 160, message = "Tên ngân hàng không được quá 160 ký tự.")
    String bankName,

    @NotBlank(message = "Số tài khoản là bắt buộc.")
    @Size(max = 40, message = "Số tài khoản không được quá 40 ký tự.")
    String accountNumber,

    @NotBlank(message = "Tên chủ tài khoản là bắt buộc.")
    @Size(max = 120, message = "Tên chủ tài khoản không được quá 120 ký tự.")
    String accountName,

    @Size(max = 30, message = "Tiền tố chuyển khoản không được quá 30 ký tự.")
    String transferPrefix,

    @Size(max = 40, message = "Mẫu QR không được quá 40 ký tự.")
    String template
) {
}
