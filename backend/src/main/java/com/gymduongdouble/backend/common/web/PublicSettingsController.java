package com.gymduongdouble.backend.common.web;

import com.gymduongdouble.backend.common.service.VietQrSettingService;
import com.gymduongdouble.backend.common.web.dto.ApiResponse;
import com.gymduongdouble.backend.common.web.dto.VietQrSettingResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller công khai thông tin thanh toán chuyển khoản VietQR (Không yêu cầu đăng nhập).
 * 
 * ====================================================================================
 * RANH GIỚI BẢO MẬT & MỤC ĐÍCH (MENTOR NOTES):
 * 1. Phục vụ Frontend công khai: Cung cấp số tài khoản, mã ngân hàng và tên chủ tài khoản
 *    để màn hình thanh toán của khách/học viên có thể tự động tạo mã QR chuyển khoản.
 * 2. Bảo mật tuyệt đối: Endpoint này mở cho toàn bộ người dùng internet, do đó dữ liệu
 *    trả về CHỈ gồm thông tin thanh toán công khai, TUYỆT ĐỐI không chứa bất kỳ khóa bí mật
 *    (Secret Key / Token) nào của hệ thống.
 * ====================================================================================
 */
@RestController
@RequestMapping("/v1/public")
@RequiredArgsConstructor
public class PublicSettingsController {

    private final VietQrSettingService vietQrSettingService;

    /**
     * Lấy thông tin tài khoản ngân hàng để phục vụ việc tạo mã VietQR ở client.
     */
    @GetMapping("/vietqr-setting")
    public ApiResponse<VietQrSettingResponse> getPublicVietQrSetting() {
        return ApiResponse.ok(vietQrSettingService.get());
    }
}
