package com.gymduongdouble.backend.common.security;

import com.gymduongdouble.backend.common.exception.BadRequestException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

@Service
@RequiredArgsConstructor
public class JwtService {

    private static final String HMAC_ALGORITHM = "HmacSHA256";

    private final JwtProperties properties;
    private final ObjectMapper objectMapper;

    public String generateAccessToken(AuthenticatedUser user) {
        return generateAccessToken(user, properties.accessTokenMinutes());
    }

    public String generateAccessToken(AuthenticatedUser user, long expirationMinutes) {
        Instant now = Instant.now();
        Instant expiresAt = now.plusSeconds(expirationMinutes * 60);

        Map<String, Object> header = Map.of(
            "alg", "HS256",
            "typ", "JWT"
        );
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("sub", user.getUsername());
        payload.put("uid", user.getId());
        payload.put("name", user.getFullName());
        payload.put("roles", roles(user));
        payload.put("iat", now.getEpochSecond());
        payload.put("exp", expiresAt.getEpochSecond());

        String headerPart = base64Url(toJson(header));
        String payloadPart = base64Url(toJson(payload));
        String signaturePart = sign(headerPart + "." + payloadPart);
        return headerPart + "." + payloadPart + "." + signaturePart;
    }

    public String extractEmail(String token) {
        Map<String, Object> claims = parseAndValidate(token);
        return claims.get("sub").toString();
    }

    public Map<String, Object> parseAndValidate(String token) {
        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            throw new BadRequestException("Token không hợp lệ.");
        }

        String expectedSignature = sign(parts[0] + "." + parts[1]);
        if (!constantTimeEquals(expectedSignature, parts[2])) {
            throw new BadRequestException("Token không hợp lệ.");
        }

        Map<String, Object> claims = fromJson(new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8));
        long exp = ((Number) claims.get("exp")).longValue();
        if (Instant.now().getEpochSecond() > exp) {
            throw new BadRequestException("Token đã hết hạn.");
        }
        return claims;
    }

    private List<String> roles(AuthenticatedUser user) {
        return user.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .map(authority -> authority.replaceFirst("^ROLE_", ""))
            .toList();
    }

    private byte[] toJson(Map<String, Object> value) {
        try {
            return objectMapper.writeValueAsBytes(value);
        } catch (Exception exception) {
            throw new IllegalStateException("Không thể tạo JWT.", exception);
        }
    }

    private Map<String, Object> fromJson(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<>() {
            });
        } catch (Exception exception) {
            throw new BadRequestException("Token không hợp lệ.");
        }
    }

    private String base64Url(byte[] value) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(value);
    }

    private String sign(String value) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(properties.secret().getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM));
            return base64Url(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("Không thể ký JWT.", exception);
        }
    }

    private boolean constantTimeEquals(String first, String second) {
        return MessageDigestSupport.constantTimeEquals(first, second);
    }
}
