package com.gymduongdouble.backend.ai.web;

import com.gymduongdouble.backend.ai.service.RetentionRevenueAdvisorService;
import com.gymduongdouble.backend.ai.web.dto.RetentionRevenueAdvisorRequest;
import com.gymduongdouble.backend.ai.web.dto.RetentionRevenueAdvisorResponse;
import com.gymduongdouble.backend.common.web.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@PreAuthorize("hasRole('OWNER')")
public class AiAdvisorController {

    private final RetentionRevenueAdvisorService retentionRevenueAdvisorService;

    @PostMapping("/v1/ai/retention-revenue-advisor")
    public ApiResponse<RetentionRevenueAdvisorResponse> retentionRevenueAdvisor(
        @Valid @RequestBody(required = false) RetentionRevenueAdvisorRequest request
    ) {
        return ApiResponse.ok(retentionRevenueAdvisorService.analyze(request));
    }
}
