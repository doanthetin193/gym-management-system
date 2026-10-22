package com.gymduongdouble.backend.common.security;

import com.gymduongdouble.backend.common.exception.RateLimitExceededException;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class InMemoryRateLimiter {

    static final int LOGIN_FAILURE_LIMIT = 5;
    static final Duration LOGIN_FAILURE_WINDOW = Duration.ofMinutes(15);
    static final Duration LOGIN_LOCK_DURATION = Duration.ofMinutes(15);
    static final int SENSITIVE_REQUEST_LIMIT = 10;
    static final Duration SENSITIVE_REQUEST_WINDOW = Duration.ofMinutes(15);

    private final Map<String, LoginAttemptState> loginAttempts = new ConcurrentHashMap<>();
    private final Map<String, WindowCounter> sensitiveCounters = new ConcurrentHashMap<>();
    private final AtomicLong operations = new AtomicLong();

    public void requireLoginAllowed(String identifier, String clientIp) {
        requireLoginKeyAllowed(loginAccountKey(identifier));
        requireLoginKeyAllowed(loginIpKey(clientIp));
    }

    public void recordLoginFailure(String identifier, String clientIp) {
        long accountRetryAfter = registerLoginFailure(loginAccountKey(identifier));
        long ipRetryAfter = registerLoginFailure(loginIpKey(clientIp));
        long retryAfter = Math.max(accountRetryAfter, ipRetryAfter);
        if (retryAfter > 0) {
            throw new RateLimitExceededException(retryAfter);
        }
    }

    public void clearLoginFailures(String identifier, String clientIp) {
        loginAttempts.remove(loginAccountKey(identifier));
        loginAttempts.remove(loginIpKey(clientIp));
    }

    public boolean tryConsumeSensitiveRequest(String operation, String actor) {
        RateLimitWindow window = increment("sensitive:" + operation + ":" + normalize(actor), SENSITIVE_REQUEST_WINDOW);
        return window.count() <= SENSITIVE_REQUEST_LIMIT;
    }

    public long retryAfterSeconds(String operation, String actor) {
        return retryAfterSeconds(activeWindow("sensitive:" + operation + ":" + normalize(actor), SENSITIVE_REQUEST_WINDOW), SENSITIVE_REQUEST_WINDOW);
    }

    private RateLimitExceededException exceeded(RateLimitWindow window, Duration duration) {
        return new RateLimitExceededException(retryAfterSeconds(window, duration));
    }

    private RateLimitWindow increment(String key, Duration duration) {
        cleanupExpiredEntries();
        Instant now = Instant.now();
        WindowCounter updated = sensitiveCounters.compute(key, (ignored, existing) -> {
            if (existing == null || existing.startedAt().plus(duration).isBefore(now)) {
                return new WindowCounter(now, 1);
            }
            return new WindowCounter(existing.startedAt(), existing.count() + 1);
        });
        return new RateLimitWindow(updated.startedAt(), updated.count());
    }

    private RateLimitWindow activeWindow(String key, Duration duration) {
        cleanupExpiredEntries();
        WindowCounter counter = sensitiveCounters.get(key);
        if (counter == null) {
            return new RateLimitWindow(Instant.now(), 0);
        }
        if (counter.startedAt().plus(duration).isBefore(Instant.now())) {
            sensitiveCounters.remove(key, counter);
            return new RateLimitWindow(Instant.now(), 0);
        }
        return new RateLimitWindow(counter.startedAt(), counter.count());
    }

    private long retryAfterSeconds(RateLimitWindow window, Duration duration) {
        long seconds = Duration.between(Instant.now(), window.startedAt().plus(duration)).toSeconds();
        return Math.max(1, seconds + 1);
    }

    private void cleanupExpiredEntries() {
        if (operations.incrementAndGet() % 128 != 0) {
            return;
        }
        Instant now = Instant.now();
        Instant threshold = now.minus(SENSITIVE_REQUEST_WINDOW);
        sensitiveCounters.entrySet().removeIf(entry -> entry.getValue().startedAt().isBefore(threshold));
        loginAttempts.entrySet().removeIf(entry -> isLoginStateExpired(entry.getValue(), now));
    }

    private void requireLoginKeyAllowed(String key) {
        cleanupExpiredEntries();
        LoginAttemptState state = loginAttempts.get(key);
        if (state == null) {
            return;
        }

        Instant now = Instant.now();
        if (isLoginStateExpired(state, now)) {
            loginAttempts.remove(key, state);
            return;
        }
        if (state.lockedUntil() != null && state.lockedUntil().isAfter(now)) {
            throw new RateLimitExceededException(retryAfterSeconds(state.lockedUntil(), now));
        }
    }

    private long registerLoginFailure(String key) {
        cleanupExpiredEntries();
        Instant now = Instant.now();
        LoginAttemptState updated = loginAttempts.compute(key, (ignored, existing) -> {
            if (existing == null || isLoginStateExpired(existing, now)) {
                return new LoginAttemptState(now, 1, null);
            }
            int failureCount = existing.failureCount() + 1;
            Instant lockedUntil = failureCount >= LOGIN_FAILURE_LIMIT ? now.plus(LOGIN_LOCK_DURATION) : null;
            return new LoginAttemptState(existing.firstFailureAt(), failureCount, lockedUntil);
        });
        return updated.lockedUntil() == null ? 0 : retryAfterSeconds(updated.lockedUntil(), now);
    }

    private boolean isLoginStateExpired(LoginAttemptState state, Instant now) {
        if (state.lockedUntil() != null) {
            return !state.lockedUntil().isAfter(now);
        }
        return !state.firstFailureAt().plus(LOGIN_FAILURE_WINDOW).isAfter(now);
    }

    private long retryAfterSeconds(Instant until, Instant now) {
        return Math.max(1, Duration.between(now, until).toSeconds() + 1);
    }

    private String loginAccountKey(String identifier) {
        return "login:account:" + normalize(identifier);
    }

    private String loginIpKey(String clientIp) {
        return "login:ip:" + normalize(clientIp);
    }

    private String normalize(String value) {
        return StringUtils.hasText(value) ? value.trim().toLowerCase(Locale.ROOT) : "unknown";
    }

    private record WindowCounter(Instant startedAt, int count) {
    }

    private record RateLimitWindow(Instant startedAt, int count) {
    }

    private record LoginAttemptState(Instant firstFailureAt, int failureCount, Instant lockedUntil) {
    }
}
