package com.gymduongdouble.backend.membership.web;

import com.gymduongdouble.backend.common.web.dto.ApiResponse;
import com.gymduongdouble.backend.membership.service.MembershipPlanService;
import com.gymduongdouble.backend.membership.web.dto.PublicMembershipPlanResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/public/membership-plans")
@RequiredArgsConstructor
public class PublicMembershipPlanController {
    private final MembershipPlanService membershipPlanService;

    @GetMapping
    public ApiResponse<List<PublicMembershipPlanResponse>> list() {
        return ApiResponse.ok(membershipPlanService.listPublic());
    }
}
