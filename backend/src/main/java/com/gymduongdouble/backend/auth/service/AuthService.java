package com.gymduongdouble.backend.auth.service;

import com.gymduongdouble.backend.auth.web.dto.AuthUserResponse;
import com.gymduongdouble.backend.auth.web.dto.ChangePasswordRequest;
import com.gymduongdouble.backend.auth.web.dto.LoginRequest;
import com.gymduongdouble.backend.auth.web.dto.LoginResponse;
import com.gymduongdouble.backend.common.exception.BadRequestException;
import com.gymduongdouble.backend.common.exception.ResourceNotFoundException;
import com.gymduongdouble.backend.common.security.AuthenticatedUser;
import com.gymduongdouble.backend.common.security.CustomUserDetailsService;
import com.gymduongdouble.backend.common.security.InMemoryRateLimiter;
import com.gymduongdouble.backend.common.security.JwtProperties;
import com.gymduongdouble.backend.common.security.JwtService;
import com.gymduongdouble.backend.common.security.PasswordPolicy;
import com.gymduongdouble.backend.user.domain.User;
import com.gymduongdouble.backend.user.repository.UserRepository;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final CustomUserDetailsService userDetailsService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;
    private final InMemoryRateLimiter rateLimiter;
    private final PasswordPolicy passwordPolicy;

    @Transactional
    public LoginResponse login(LoginRequest request, String clientIp) {
        rateLimiter.requireLoginAllowed(request.email(), clientIp);
        try {
            AuthenticatedUser user = loadUser(request.email());
            if (!user.isEnabled() || !user.isAccountNonLocked() || !passwordEncoder.matches(request.password(), user.getPassword())) {
                throw new BadCredentialsException("Email hoặc mật khẩu không đúng.");
            }

            userRepository.findById(user.getId()).ifPresent(account -> account.setLastLoginAt(Instant.now()));

            boolean remember = Boolean.TRUE.equals(request.rememberMe());
            long expirationMinutes = remember ? 30L * 24 * 60 : jwtProperties.accessTokenMinutes();

            String token = jwtService.generateAccessToken(user, expirationMinutes);
            rateLimiter.clearLoginFailures(request.email(), clientIp);
            return new LoginResponse(
                "Bearer",
                token,
                expirationMinutes,
                AuthUserResponse.from(user)
            );
        } catch (BadCredentialsException exception) {
            rateLimiter.recordLoginFailure(request.email(), clientIp);
            throw exception;
        }
    }

    @Transactional
    public void changePassword(AuthenticatedUser authenticatedUser, ChangePasswordRequest request) {
        User user = userRepository.findById(authenticatedUser.getId())
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản hiện tại."));

        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Mật khẩu hiện tại không đúng.");
        }

        if (passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Mật khẩu mới không được trùng mật khẩu hiện tại.");
        }

        String password = passwordPolicy.requireValid(request.newPassword(), user.getEmail(), user.getPhone());
        user.setPasswordHash(passwordEncoder.encode(password));
        user.revokeActiveTokens();
        userRepository.save(user);
    }

    private AuthenticatedUser loadUser(String email) {
        try {
            return (AuthenticatedUser) userDetailsService.loadUserByUsername(email);
        } catch (UsernameNotFoundException exception) {
            throw new BadCredentialsException("Email hoặc mật khẩu không đúng.");
        }
    }
}
