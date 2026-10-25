package com.gymduongdouble.backend.common.web;

import com.gymduongdouble.backend.common.service.VietQrSettingService;
import com.gymduongdouble.backend.common.web.dto.ApiResponse;
import com.gymduongdouble.backend.common.web.dto.UpdateVietQrSettingRequest;
import com.gymduongdouble.backend.common.web.dto.VietQrSettingResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller quản trị cấu hình hệ thống (Dành riêng cho OWNER).
 * 
 * ====================================================================================
 * VAI TRÒ & PHÂN QUYỀN (MENTOR NOTES):
 * 1. Quyền hạn tối cao: Chỉ duy nhất Chủ phòng (OWNER) mới có quyền xem và sửa thông tin
 *    ngân hàng nhận tiền thanh toán VietQR.
 * 2. An toàn dữ liệu: Ngăn chặn nhân viên PT hay bất kỳ người dùng nào khác can thiệp
 *    thay đổi số tài khoản chuyển tiền của phòng gym.
 * ====================================================================================
 */
@RestController
@RequestMapping("/v1/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final VietQrSettingService vietQrSettingService;

    /**
     * Lấy toàn bộ thông tin cấu hình VietQR hiện tại (Chỉ OWNER được xem).
     */
    @GetMapping("/vietqr")
    @PreAuthorize("hasRole('OWNER')")
    public ApiResponse<VietQrSettingResponse> getVietQrSetting() {
        return ApiResponse.ok(vietQrSettingService.get());
    }

    /**
     * Cập nhật thông tin cấu hình VietQR (Chỉ OWNER được sửa).
     * Áp dụng lưu vết Key-Value trong bảng `system_settings`.
     */
    @PutMapping("/vietqr")
    @PreAuthorize("hasRole('OWNER')")
    public ApiResponse<VietQrSettingResponse> updateVietQrSetting(@Valid @RequestBody UpdateVietQrSettingRequest request) {
        return ApiResponse.ok(vietQrSettingService.update(request));
    }
}
