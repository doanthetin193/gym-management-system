package com.gymduongdouble.backend.common.service;

import com.gymduongdouble.backend.common.domain.SystemSetting;
import com.gymduongdouble.backend.common.repository.SystemSettingRepository;
import com.gymduongdouble.backend.common.web.dto.UpdateVietQrSettingRequest;
import com.gymduongdouble.backend.common.web.dto.VietQrSettingResponse;
import java.time.Instant;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Dịch vụ Quản lý Cấu hình Cổng thanh toán chuyển khoản VietQR.
 * 
 * ====================================================================================
 * KIẾN TRÚC & QUY TẮC AN TOÀN (MENTOR NOTES):
 * 1. Mô hình Cấu hình Key-Value (Dynamic System Settings Pattern):
 *    - Các tham số VietQR được lưu dạng Key-Value trong bảng `system_settings` (tiền tố `payment.vietqr.*`).
 *    - Ưu điểm: Chủ phòng có thể thay đổi số tài khoản nhận tiền hoặc ngân hàng linh hoạt ngay trên UI
 *      mà không cần sửa code, không cần cấu hình lại `application.yml` và không cần restart server.
 * 2. Ranh giới Bảo mật (Security Boundary):
 *    - Cấu hình này được công khai qua endpoint `GET /v1/public/vietqr-setting` để frontend
 *      render mã QR cho học viên quét chuyển khoản.
 *    - NGUYÊN TẮC SỐNG CÒN: Chỉ lưu các thông tin công khai (Số TK, Tên chủ TK, Mã ngân hàng VietQR).
 *      TUYỆT ĐỐI KHÔNG lưu API Secret, Private Key, Token ngân hàng vào bảng `system_settings`.
 * 3. Mô hình Vận hành Thực tế (Manual Confirmation vs Automatic Webhook):
 *    - Sinh mã VietQR KHÔNG đồng nghĩa với việc tiền đã vào tài khoản và KHÔNG tự động gạch nợ.
 *    - Hệ thống áp dụng luồng đối soát thủ công (Owner Cashier Confirmation):
 *      Học viên quét mã chuyển khoản -> Chủ phòng check biến động số dư trên app ngân hàng ->
 *      Chủ phòng bấm nút "Thu tiền" trên hệ thống để ghi nhận `Payment` và giảm trừ `DebtRecord`.
 * ====================================================================================
 */
@Service
@RequiredArgsConstructor
public class VietQrSettingService {

    private static final String ENABLED_KEY = "payment.vietqr.enabled";
    private static final String BANK_CODE_KEY = "payment.vietqr.bank_code";
    private static final String BANK_NAME_KEY = "payment.vietqr.bank_name";
    private static final String ACCOUNT_NUMBER_KEY = "payment.vietqr.account_number";
    private static final String ACCOUNT_NAME_KEY = "payment.vietqr.account_name";
    private static final String TRANSFER_PREFIX_KEY = "payment.vietqr.transfer_prefix";
    private static final String TEMPLATE_KEY = "payment.vietqr.template";

    private final SystemSettingRepository systemSettingRepository;

    /**
     * Lấy cấu hình VietQR hiện tại từ database.
     * Cung cấp giá trị mặc định an toàn (enabled = false, prefix = "GYMDD", template = "compact2") nếu chưa cấu hình.
     */
    @Transactional(readOnly = true)
    public VietQrSettingResponse get() {
        Map<String, String> settings = systemSettingRepository.findAllById(
            java.util.List.of(
                ENABLED_KEY,
                BANK_CODE_KEY,
                BANK_NAME_KEY,
                ACCOUNT_NUMBER_KEY,
                ACCOUNT_NAME_KEY,
                TRANSFER_PREFIX_KEY,
                TEMPLATE_KEY
            )
        ).stream().collect(Collectors.toMap(SystemSetting::getKey, SystemSetting::getValue));

        return new VietQrSettingResponse(
            Boolean.parseBoolean(settings.getOrDefault(ENABLED_KEY, "false")),
            settings.getOrDefault(BANK_CODE_KEY, ""),
            settings.getOrDefault(BANK_NAME_KEY, ""),
            settings.getOrDefault(ACCOUNT_NUMBER_KEY, ""),
            settings.getOrDefault(ACCOUNT_NAME_KEY, ""),
            settings.getOrDefault(TRANSFER_PREFIX_KEY, "GYMDD"),
            settings.getOrDefault(TEMPLATE_KEY, "compact2")
        );
    }

    /**
     * Cập nhật thông tin cấu hình VietQR (Chỉ dành riêng cho vai trò OWNER).
     * Áp dụng Upsert cho từng tham số trong bảng system_settings.
     */
    @Transactional
    public VietQrSettingResponse update(UpdateVietQrSettingRequest request) {
        upsert(ENABLED_KEY, Boolean.toString(Boolean.TRUE.equals(request.enabled())), "Bật/tắt hiển thị VietQR khi thu tiền");
        upsert(BANK_CODE_KEY, clean(request.bankCode()), "Mã ngân hàng VietQR");
        upsert(BANK_NAME_KEY, clean(request.bankName()), "Tên ngân hàng nhận tiền");
        upsert(ACCOUNT_NUMBER_KEY, clean(request.accountNumber()), "Số tài khoản nhận tiền");
        upsert(ACCOUNT_NAME_KEY, clean(request.accountName()), "Tên chủ tài khoản nhận tiền");
        upsert(TRANSFER_PREFIX_KEY, cleanOrDefault(request.transferPrefix(), "GYMDD"), "Tiền tố nội dung chuyển khoản");
        upsert(TEMPLATE_KEY, cleanOrDefault(request.template(), "compact2"), "Mẫu hiển thị QR của VietQR");
        return get();
    }

    /**
     * Thao tác Upsert: Nếu khóa đã tồn tại thì cập nhật giá trị mới, nếu chưa thì tạo mới bản ghi.
     */
    private void upsert(String key, String value, String description) {
        SystemSetting setting = systemSettingRepository.findById(key).orElseGet(SystemSetting::new);
        setting.setKey(key);
        setting.setValue(value);
        setting.setDescription(description);
        setting.setUpdatedAt(Instant.now());
        systemSettingRepository.save(setting);
    }

    private String clean(String value) {
        return value == null ? "" : value.trim();
    }

    private String cleanOrDefault(String value, String defaultValue) {
        String cleaned = clean(value);
        return cleaned.isBlank() ? defaultValue : cleaned;
    }
}
