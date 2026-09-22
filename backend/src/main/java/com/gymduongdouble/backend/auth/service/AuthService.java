package com.gymduongdouble.backend.auth.service;

import com.gymduongdouble.backend.auth.web.dto.AuthUserResponse;
import com.gymduongdouble.backend.auth.web.dto.LoginRequest;
import com.gymduongdouble.backend.auth.web.dto.LoginResponse;
import com.gymduongdouble.backend.common.security.AuthenticatedUser;
import com.gymduongdouble.backend.common.security.CustomUserDetailsService;
import com.gymduongdouble.backend.common.security.JwtProperties;
import com.gymduongdouble.backend.common.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final CustomUserDetailsService userDetailsService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;

    public LoginResponse login(LoginRequest request) {
        AuthenticatedUser user = loadUser(request.username());
        if (!user.isEnabled() || !user.isAccountNonLocked() || !passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new BadCredentialsException("Tên đăng nhập hoặc mật khẩu không đúng.");
        }

        String token = jwtService.generateAccessToken(user);
        return new LoginResponse(
            "Bearer",
            token,
            jwtProperties.accessTokenMinutes(),
            AuthUserResponse.from(user)
        );
    }

    private AuthenticatedUser loadUser(String username) {
        try {
            return (AuthenticatedUser) userDetailsService.loadUserByUsername(username);
        } catch (UsernameNotFoundException exception) {
            throw new BadCredentialsException("Tên đăng nhập hoặc mật khẩu không đúng.");
        }
    }
}
