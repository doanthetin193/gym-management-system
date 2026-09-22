package com.gymduongdouble.backend.membership.web;

import com.gymduongdouble.backend.common.web.dto.ApiResponse;
import com.gymduongdouble.backend.membership.service.MembershipPlanService;
import com.gymduongdouble.backend.membership.web.dto.MembershipPlanRequest;
import com.gymduongdouble.backend.membership.web.dto.MembershipPlanResponse;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/membership-plans")
@RequiredArgsConstructor
public class MembershipPlanController {

    private final MembershipPlanService membershipPlanService;

    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    public ApiResponse<MembershipPlanResponse> create(@Valid @RequestBody MembershipPlanRequest request) {
        return ApiResponse.created(membershipPlanService.create(request));
    }

    @GetMapping
    public ApiResponse<List<MembershipPlanResponse>> listActive() {
        return ApiResponse.ok(membershipPlanService.listActive());
    }
}
