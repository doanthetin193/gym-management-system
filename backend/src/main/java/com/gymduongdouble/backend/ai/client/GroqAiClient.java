package com.gymduongdouble.backend.ai.client;

import com.gymduongdouble.backend.ai.config.GroqAiProperties;
import com.gymduongdouble.backend.common.exception.BadRequestException;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Component
@RequiredArgsConstructor
public class GroqAiClient {

    private final GroqAiProperties properties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public <T> T requestJson(String systemPrompt, Object anonymizedPayload, Class<T> responseType) {
        List<String> keys = properties.resolvedApiKeys();
        if (keys.isEmpty()) {
            throw new BadRequestException("Chưa cấu hình GROQ_API_KEYS cho chức năng AI.");
        }

        String payloadJson = writeJson(anonymizedPayload);
        String userPrompt = """
            Dữ liệu dưới đây đã được tổng hợp và ẩn danh. Không suy đoán danh tính cá nhân.
            Hãy phân tích đúng nghiệp vụ phòng gym nhỏ và chỉ trả về JSON hợp lệ theo schema đã yêu cầu.

            %s
            """.formatted(payloadJson);

        RuntimeException lastError = null;
        for (String key : keys) {
            try {
                return requestWithKey(key, systemPrompt, userPrompt, responseType);
            } catch (RetryableGroqException error) {
                lastError = error;
            }
        }

        if (lastError != null) {
            throw lastError;
        }
        throw new BadRequestException("Không gọi được AI provider.");
    }

    private <T> T requestWithKey(String key, String systemPrompt, String userPrompt, Class<T> responseType) {
        try {
            String requestBody = writeJson(Map.of(
                "model", properties.getModel(),
                "temperature", 0.2,
                "response_format", Map.of("type", "json_object"),
                "messages", List.of(
                    Map.of("role", "system", "content", systemPrompt),
                    Map.of("role", "user", "content", userPrompt)
                )
            ));

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(properties.getEndpoint()))
                .timeout(Duration.ofSeconds(properties.getTimeoutSeconds()))
                .header("Authorization", "Bearer " + key)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                if (response.statusCode() == 401 || response.statusCode() == 403 || response.statusCode() == 429) {
                    throw new RetryableGroqException(response.statusCode());
                }
                throw new BadRequestException("Groq từ chối yêu cầu AI. Mã lỗi: " + response.statusCode());
            }

            JsonNode root = objectMapper.readTree(response.body());
            String content = root.path("choices").path(0).path("message").path("content").asString();
            if (content.isBlank()) {
                throw new BadRequestException("Groq không trả về nội dung phân tích AI.");
            }
            return objectMapper.readValue(extractJson(content), responseType);
        } catch (IOException exception) {
            throw new BadRequestException("Không đọc được phản hồi AI theo định dạng JSON.");
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new BadRequestException("Yêu cầu AI bị gián đoạn.");
        }
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (RuntimeException exception) {
            throw new BadRequestException("Không tạo được payload AI.");
        }
    }

    private String extractJson(String content) {
        String trimmed = content.trim();
        if (trimmed.startsWith("```")) {
            trimmed = trimmed.replaceFirst("^```(?:json)?", "").replaceFirst("```$", "").trim();
        }

        int start = trimmed.indexOf('{');
        int end = trimmed.lastIndexOf('}');
        if (start < 0 || end <= start) {
            throw new BadRequestException("AI trả về dữ liệu không đúng định dạng JSON.");
        }
        return trimmed.substring(start, end + 1);
    }

    private static final class RetryableGroqException extends RuntimeException {
        private RetryableGroqException(int statusCode) {
            super("Groq từ chối khóa API hiện tại. Mã lỗi: " + statusCode);
        }
    }
}
