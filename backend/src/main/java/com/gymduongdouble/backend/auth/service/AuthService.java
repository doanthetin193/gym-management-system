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
        // [TRUY VẾT RATE LIMIT - BƯỚC 2.1: CỔNG BẢO VỆ ĐẦU TIÊN]
        // Kiểm tra xem Account hoặc IP này có đang bị 'lockedUntil' còn hiệu lực hay không.
        // Nếu đang bị khóa (ví dụ lần thứ 6 thử lại): Ném RateLimitExceededException (HTTP 429) NGAY TẠI ĐÂY!
        // Server ngắt request lập tức, KHÔNG tốn tài nguyên truy vấn Database hay tính toán hash BCrypt bên dưới.
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

            // [TRUY VẾT RATE LIMIT - BƯỚC 2.2: KỊCH BẢN ĐĂNG NHẬP THÀNH CÔNG]
            // Khi mật khẩu đúng: Xóa sạch toàn bộ lịch sử gõ sai của cả Account và IP khỏi ConcurrentHashMap trong RAM.
            rateLimiter.clearLoginFailures(request.email(), clientIp);
            return new LoginResponse(
                "Bearer",
                token,
                expirationMinutes,
                AuthUserResponse.from(user)
            );
        } catch (BadCredentialsException exception) {
            // [TRUY VẾT RATE LIMIT - BƯỚC 2.3: KỊCH BẢN NHẬP SAI MẬT KHẨU]
            // Ghi nhận thêm 1 lần sai vào bộ đếm RAM:
            // - Lần sai 1, 2, 3, 4: failureCount tăng lên, chưa khóa. Hàm kết thúc bình thường, ném tiếp BadCredentialsException -> HTTP 401.
            // - Lần sai THỨ 5: failureCount = 5 -> đặt lockedUntil = now + 15 phút.
            //   Chính hàm recordLoginFailure sẽ ném RateLimitExceededException -> biến thành HTTP 429 ngay tại cú click thứ 5 này!
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
