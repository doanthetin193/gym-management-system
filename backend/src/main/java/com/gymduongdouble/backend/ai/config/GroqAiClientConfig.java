package com.gymduongdouble.backend.ai.config;

import java.net.http.HttpClient;
import java.time.Duration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GroqAiClientConfig {

    @Bean
    HttpClient groqHttpClient(GroqAiProperties properties) {
        return HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(properties.getTimeoutSeconds()))
            .build();
    }
}
