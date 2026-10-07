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

@RestController
@RequestMapping("/v1/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final VietQrSettingService vietQrSettingService;

    @GetMapping("/vietqr")
    @PreAuthorize("hasRole('OWNER')")
    public ApiResponse<VietQrSettingResponse> getVietQrSetting() {
        return ApiResponse.ok(vietQrSettingService.get());
    }

    @PutMapping("/vietqr")
    @PreAuthorize("hasRole('OWNER')")
    public ApiResponse<VietQrSettingResponse> updateVietQrSetting(@Valid @RequestBody UpdateVietQrSettingRequest request) {
        return ApiResponse.ok(vietQrSettingService.update(request));
    }
}
