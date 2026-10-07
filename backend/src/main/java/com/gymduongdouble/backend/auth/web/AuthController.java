package com.gymduongdouble.backend.auth.web;

import com.gymduongdouble.backend.auth.service.AuthService;
import com.gymduongdouble.backend.auth.web.dto.AuthUserResponse;
import com.gymduongdouble.backend.auth.web.dto.ChangePasswordRequest;
import com.gymduongdouble.backend.auth.web.dto.LoginRequest;
import com.gymduongdouble.backend.auth.web.dto.LoginResponse;
import com.gymduongdouble.backend.common.security.AuthenticatedUser;
import com.gymduongdouble.backend.common.web.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok(authService.login(request));
    }

    @GetMapping("/me")
    public ApiResponse<AuthUserResponse> me(@AuthenticationPrincipal AuthenticatedUser user) {
        return ApiResponse.ok(AuthUserResponse.from(user));
    }

    @PostMapping("/change-password")
    public ApiResponse<Void> changePassword(
        @AuthenticationPrincipal AuthenticatedUser user,
        @Valid @RequestBody ChangePasswordRequest request
    ) {
        authService.changePassword(user, request);
        return ApiResponse.ok(null);
    }
}
