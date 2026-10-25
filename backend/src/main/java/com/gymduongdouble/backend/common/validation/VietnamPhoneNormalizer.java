package com.gymduongdouble.backend.common.validation;

import com.gymduongdouble.backend.common.exception.BadRequestException;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class VietnamPhoneNormalizer {

    // Regex số di động Việt Nam: Bắt đầu bằng 0, tiếp theo là 3, 5, 7, 8 hoặc 9, và 8 chữ số tiếp theo (Tổng đúng 10 số).
    // Khớp tất cả các nhà mạng: Viettel (03x, 09x, 086), Vinaphone (08x, 09x), Mobifone (07x, 09x), Vietnamobile (05x)...
    private static final String VIETNAM_MOBILE_PATTERN = "0(?:3|5|7|8|9)\\d{8}";

    /**
     * Chuẩn hóa và bắt buộc số điện thoại phải hợp lệ:
     * 1. Gọt sạch ký tự phân cách (dấu cách, dấu chấm, gạch ngang) và đổi đầu số 84 -> 0.
     * 2. So khớp Regex: Nếu không đúng định dạng di động 10 số -> Ném BadRequestException (HTTP 400).
     */
    public String normalizeRequired(String rawPhone, String fieldLabel) {
        if (!StringUtils.hasText(rawPhone)) {
            throw new BadRequestException(fieldLabel + " là bắt buộc.");
        }

        String digits = normalizeForLookup(rawPhone);
        if (!digits.matches(VIETNAM_MOBILE_PATTERN)) {
            throw new BadRequestException(fieldLabel + " phải là số di động Việt Nam hợp lệ.");
        }
        return digits;
    }

    /**
     * Chuẩn hóa số điện thoại tùy chọn (dùng cho số Zalo):
     * Nếu người dùng có nhập thì chuẩn hóa kiểm tra, nếu để trống thì trả về null.
     */
    public String normalizeOptional(String rawPhone, String fieldLabel) {
        return StringUtils.hasText(rawPhone) ? normalizeRequired(rawPhone, fieldLabel) : null;
    }

    /**
     * Thuật toán làm sạch chuỗi số điện thoại:
     * 1. regex "\\D" (Non-digit): Xóa sạch mọi ký tự không phải số ("0901 000 004" -> "0901000004").
     * 2. Nếu là đầu số quốc tế 84 (dài 11 chữ số): Cắt bỏ "84" thay bằng "0" ("84901000004" -> "0901000004").
     */
    public String normalizeForLookup(String rawPhone) {
        String digits = rawPhone == null ? "" : rawPhone.replaceAll("\\D", "");
        if (digits.startsWith("84") && digits.length() == 11) {
            return "0" + digits.substring(2);
        }
        return digits;
    }
}
