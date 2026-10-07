package com.gymduongdouble.backend.user.web.dto;

import com.gymduongdouble.backend.common.enums.UserStatus;
import com.gymduongdouble.backend.user.domain.User;
import java.time.Instant;

public record TeamUserResponse(
    Long id,
    String email,
    String phone,
    String fullName,
    String roleCode,
    String roleName,
    UserStatus status,
    Instant lastLoginAt,
    Instant createdAt
) {
    public static TeamUserResponse from(User user) {
        String roleCode = user.getRoles().stream()
            .anyMatch(r -> "OWNER".equals(r.getCode())) ? "OWNER" : "PT";
        String roleName = "OWNER".equals(roleCode) ? "Chủ phòng" : "Huấn luyện viên (PT)";
        return new TeamUserResponse(
            user.getId(),
            user.getEmail(),
            user.getPhone(),
            user.getFullName(),
            roleCode,
            roleName,
            user.getStatus(),
            user.getLastLoginAt(),
            user.getCreatedAt()
        );
    }
}
