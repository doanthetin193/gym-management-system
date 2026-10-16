package com.gymduongdouble.backend.common.config;

import com.gymduongdouble.backend.common.security.ApiSecurityHeadersFilter;
import com.gymduongdouble.backend.common.security.JwtAuthenticationFilter;
import com.gymduongdouble.backend.common.security.JwtProperties;
import com.gymduongdouble.backend.common.security.JsonAccessDeniedHandler;
import com.gymduongdouble.backend.common.security.JsonAuthenticationEntryPoint;
import com.gymduongdouble.backend.common.security.SensitiveEndpointRateLimitFilter;
import jakarta.servlet.Filter;
import java.util.List;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.http.HttpHeaders;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableMethodSecurity
@EnableConfigurationProperties({SecurityConfig.CorsProperties.class, JwtProperties.class})
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(
        HttpSecurity http,
        ApiSecurityHeadersFilter apiSecurityHeadersFilter,
        JwtAuthenticationFilter jwtAuthenticationFilter,
        SensitiveEndpointRateLimitFilter sensitiveEndpointRateLimitFilter,
        JsonAuthenticationEntryPoint authenticationEntryPoint,
        JsonAccessDeniedHandler accessDeniedHandler
    ) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(Customizer.withDefaults())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .httpBasic(httpBasic -> httpBasic.disable())
            .formLogin(formLogin -> formLogin.disable())
            .exceptionHandling(exception -> exception
                .authenticationEntryPoint(authenticationEntryPoint)
                .accessDeniedHandler(accessDeniedHandler)
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/health", "/v1/health", "/v1/auth/login", "/v1/public/**").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(apiSecurityHeadersFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterAfter(sensitiveEndpointRateLimitFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    FilterRegistrationBean<ApiSecurityHeadersFilter> apiSecurityHeadersFilterRegistration(
        ApiSecurityHeadersFilter apiSecurityHeadersFilter
    ) {
        return disabledFilterRegistration(apiSecurityHeadersFilter);
    }

    @Bean
    FilterRegistrationBean<JwtAuthenticationFilter> jwtAuthenticationFilterRegistration(
        JwtAuthenticationFilter jwtAuthenticationFilter
    ) {
        return disabledFilterRegistration(jwtAuthenticationFilter);
    }

    @Bean
    FilterRegistrationBean<SensitiveEndpointRateLimitFilter> sensitiveEndpointRateLimitFilterRegistration(
        SensitiveEndpointRateLimitFilter sensitiveEndpointRateLimitFilter
    ) {
        return disabledFilterRegistration(sensitiveEndpointRateLimitFilter);
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource(CorsProperties properties) {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(properties.allowedOrigins());
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of(HttpHeaders.RETRY_AFTER));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @ConfigurationProperties(prefix = "app.cors")
    public record CorsProperties(List<String> allowedOrigins) {
    }

    private <T extends Filter> FilterRegistrationBean<T> disabledFilterRegistration(T filter) {
        FilterRegistrationBean<T> registration = new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }
}
