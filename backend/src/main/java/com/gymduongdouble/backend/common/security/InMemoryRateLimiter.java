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
    static final Duration LOGIN_WINDOW = Duration.ofMinutes(15);
    static final int SENSITIVE_REQUEST_LIMIT = 10;
    static final Duration SENSITIVE_REQUEST_WINDOW = Duration.ofMinutes(15);

    private final Map<String, WindowCounter> counters = new ConcurrentHashMap<>();
    private final AtomicLong operations = new AtomicLong();

    public void requireLoginAllowed(String identifier, String clientIp) {
        RateLimitWindow accountWindow = activeWindow(loginAccountKey(identifier), LOGIN_WINDOW);
        RateLimitWindow ipWindow = activeWindow(loginIpKey(clientIp), LOGIN_WINDOW);
        if (accountWindow.count() >= LOGIN_FAILURE_LIMIT) {
            throw exceeded(accountWindow, LOGIN_WINDOW);
        }
        if (ipWindow.count() >= LOGIN_FAILURE_LIMIT) {
            throw exceeded(ipWindow, LOGIN_WINDOW);
        }
    }

    public void recordLoginFailure(String identifier, String clientIp) {
        increment(loginAccountKey(identifier), LOGIN_WINDOW);
        increment(loginIpKey(clientIp), LOGIN_WINDOW);
    }

    public void clearLoginFailures(String identifier, String clientIp) {
        counters.remove(loginAccountKey(identifier));
        counters.remove(loginIpKey(clientIp));
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
        WindowCounter updated = counters.compute(key, (ignored, existing) -> {
            if (existing == null || existing.startedAt().plus(duration).isBefore(now)) {
                return new WindowCounter(now, 1);
            }
            return new WindowCounter(existing.startedAt(), existing.count() + 1);
        });
        return new RateLimitWindow(updated.startedAt(), updated.count());
    }

    private RateLimitWindow activeWindow(String key, Duration duration) {
        cleanupExpiredEntries();
        WindowCounter counter = counters.get(key);
        if (counter == null) {
            return new RateLimitWindow(Instant.now(), 0);
        }
        if (counter.startedAt().plus(duration).isBefore(Instant.now())) {
            counters.remove(key, counter);
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
        Instant threshold = Instant.now().minus(LOGIN_WINDOW);
        counters.entrySet().removeIf(entry -> entry.getValue().startedAt().isBefore(threshold));
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
}
