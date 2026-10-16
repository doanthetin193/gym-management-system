package com.gymduongdouble.backend.common.validation;

import com.gymduongdouble.backend.common.exception.BadRequestException;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class VietnamPhoneNormalizer {

    private static final String VIETNAM_MOBILE_PATTERN = "0(?:3|5|7|8|9)\\d{8}";

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

    public String normalizeOptional(String rawPhone, String fieldLabel) {
        return StringUtils.hasText(rawPhone) ? normalizeRequired(rawPhone, fieldLabel) : null;
    }

    public String normalizeForLookup(String rawPhone) {
        String digits = rawPhone == null ? "" : rawPhone.replaceAll("\\D", "");
        if (digits.startsWith("84") && digits.length() == 11) {
            return "0" + digits.substring(2);
        }
        return digits;
    }
}
