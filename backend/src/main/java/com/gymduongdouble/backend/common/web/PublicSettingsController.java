package com.gymduongdouble.backend.common.web;

import com.gymduongdouble.backend.common.service.VietQrSettingService;
import com.gymduongdouble.backend.common.web.dto.ApiResponse;
import com.gymduongdouble.backend.common.web.dto.VietQrSettingResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/public")
@RequiredArgsConstructor
public class PublicSettingsController {

    private final VietQrSettingService vietQrSettingService;

    @GetMapping("/vietqr-setting")
    public ApiResponse<VietQrSettingResponse> getPublicVietQrSetting() {
        return ApiResponse.ok(vietQrSettingService.get());
    }
}
