package com.gymduongdouble.backend.ai.config;

import java.util.Arrays;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.ai.groq")
public class GroqAiProperties {

    private String apiKeys = "";
    private String model = "openai/gpt-oss-20b";
    private String endpoint = "https://api.groq.com/openai/v1/chat/completions";
    private int timeoutSeconds = 25;

    public String getApiKeys() {
        return apiKeys;
    }

    public void setApiKeys(String apiKeys) {
        this.apiKeys = apiKeys;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public String getEndpoint() {
        return endpoint;
    }

    public void setEndpoint(String endpoint) {
        this.endpoint = endpoint;
    }

    public int getTimeoutSeconds() {
        return timeoutSeconds;
    }

    public void setTimeoutSeconds(int timeoutSeconds) {
        this.timeoutSeconds = timeoutSeconds;
    }

    public List<String> resolvedApiKeys() {
        if (apiKeys == null || apiKeys.isBlank()) {
            return List.of();
        }
        return Arrays.stream(apiKeys.split(","))
            .map(String::trim)
            .filter(key -> !key.isBlank())
            .distinct()
            .toList();
    }
}
