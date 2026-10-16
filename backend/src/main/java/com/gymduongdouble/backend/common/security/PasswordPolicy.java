package com.gymduongdouble.backend.common.security;

import com.gymduongdouble.backend.common.exception.BadRequestException;
import java.util.Locale;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class PasswordPolicy {

    public String requireValid(String password, String... identifiers) {
        if (!StringUtils.hasText(password)) {
            throw new BadRequestException("Mật khẩu là bắt buộc.");
        }

        String cleanPassword = password.trim();
        if (cleanPassword.length() < 8) {
            throw new BadRequestException("Mật khẩu phải có ít nhất 8 ký tự.");
        }
        if (cleanPassword.chars().noneMatch(Character::isLetter)
            || cleanPassword.chars().noneMatch(Character::isDigit)) {
            throw new BadRequestException("Mật khẩu phải có cả chữ và số.");
        }

        for (String identifier : identifiers) {
            if (matchesIdentifier(cleanPassword, identifier)) {
                throw new BadRequestException("Mật khẩu không được trùng với email hoặc số điện thoại đăng nhập.");
            }
        }
        return cleanPassword;
    }

    private boolean matchesIdentifier(String password, String identifier) {
        if (!StringUtils.hasText(identifier)) {
            return false;
        }
        if (password.equalsIgnoreCase(identifier.trim())) {
            return true;
        }

        String identifierDigits = identifier.replaceAll("\\D", "");
        String passwordDigits = password.replaceAll("\\D", "");
        return identifierDigits.length() >= 8 && identifierDigits.equals(passwordDigits);
    }
}
