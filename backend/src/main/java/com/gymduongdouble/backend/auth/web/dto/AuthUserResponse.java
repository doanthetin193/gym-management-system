package com.gymduongdouble.backend.auth.web.dto;

import com.gymduongdouble.backend.common.security.AuthenticatedUser;
import java.util.List;
import org.springframework.security.core.GrantedAuthority;

public record AuthUserResponse(
    Long id,
    String username,
    String fullName,
    List<String> roles
) {

    public static AuthUserResponse from(AuthenticatedUser user) {
        return new AuthUserResponse(
            user.getId(),
            user.getUsername(),
            user.getFullName(),
            user.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .map(authority -> authority.replaceFirst("^ROLE_", ""))
                .toList()
        );
    }
}
