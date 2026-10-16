package com.gymduongdouble.backend.common.security;

import com.gymduongdouble.backend.common.web.dto.ApiError;
import com.gymduongdouble.backend.common.web.dto.ApiResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import tools.jackson.databind.ObjectMapper;

@Component
@RequiredArgsConstructor
public class SensitiveEndpointRateLimitFilter extends OncePerRequestFilter {

    private final InMemoryRateLimiter rateLimiter;
    private final ObjectMapper objectMapper;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return sensitiveOperation(request) == null;
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        String operation = sensitiveOperation(request);
        String actor = authenticatedActorOrIp(request);
        if (!rateLimiter.tryConsumeSensitiveRequest(operation, actor)) {
            long retryAfter = rateLimiter.retryAfterSeconds(operation, actor);
            response.setStatus(429);
            response.setHeader("Retry-After", String.valueOf(retryAfter));
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            objectMapper.writeValue(
                response.getOutputStream(),
                ApiResponse.fail(
                    "Thao tác bị giới hạn tạm thời. Vui lòng thử lại sau.",
                    ApiError.of("RATE_LIMITED", "Thao tác bị giới hạn tạm thời. Vui lòng thử lại sau.")
                )
            );
            return;
        }
        filterChain.doFilter(request, response);
    }

    private String sensitiveOperation(HttpServletRequest request) {
        if (!"POST".equalsIgnoreCase(request.getMethod())) {
            return null;
        }
        String path = request.getRequestURI().substring(request.getContextPath().length());
        if ("/v1/auth/change-password".equals(path)) {
            return "change-password";
        }
        if ("/v1/settings/team-users".equals(path)) {
            return "create-team-user";
        }
        if (path.matches("/v1/settings/team-users/\\d+/reset-password")) {
            return "reset-team-password";
        }
        if (path.matches("/v1/members/\\d+/portal-account(?:/reset-password)?")) {
            return "portal-account";
        }
        if ("/v1/ai/retention-revenue-advisor".equals(path)) {
            return "ai-advisor";
        }
        return null;
    }

    private String authenticatedActorOrIp(HttpServletRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && authentication.getName() != null) {
            return "user:" + authentication.getName();
        }
        return "ip:" + request.getRemoteAddr();
    }
}
