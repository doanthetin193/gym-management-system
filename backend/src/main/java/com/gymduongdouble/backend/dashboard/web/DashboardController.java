package com.gymduongdouble.backend.dashboard.web;

import com.gymduongdouble.backend.common.web.dto.ApiResponse;
import com.gymduongdouble.backend.dashboard.service.DashboardService;
import com.gymduongdouble.backend.dashboard.web.dto.BusinessGoalProgressResponse;
import com.gymduongdouble.backend.dashboard.web.dto.BusinessGoalRequest;
import com.gymduongdouble.backend.dashboard.web.dto.BusinessGoalResponse;
import com.gymduongdouble.backend.dashboard.web.dto.FinanceReportResponse;
import com.gymduongdouble.backend.dashboard.web.dto.MemberReportResponse;
import com.gymduongdouble.backend.dashboard.web.dto.NotificationResponse;
import com.gymduongdouble.backend.dashboard.web.dto.OwnerDashboardResponse;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@PreAuthorize("hasRole('OWNER')")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/v1/dashboard/owner")
    public ApiResponse<OwnerDashboardResponse> ownerDashboard(
        @RequestParam(required = false) Integer year,
        @RequestParam(required = false) Integer month
    ) {
        return ApiResponse.ok(dashboardService.ownerDashboard(year, month));
    }

    @GetMapping("/v1/business-goals")
    public ApiResponse<List<BusinessGoalResponse>> listGoals(
        @RequestParam(required = false) Integer year,
        @RequestParam(required = false) Integer month
    ) {
        return ApiResponse.ok(dashboardService.listGoals(year, month));
    }

    @PostMapping("/v1/business-goals")
    public ApiResponse<BusinessGoalResponse> createGoal(@Valid @RequestBody BusinessGoalRequest request) {
        return ApiResponse.created(dashboardService.createGoal(request));
    }

    @PutMapping("/v1/business-goals/{id}")
    public ApiResponse<BusinessGoalResponse> updateGoal(
        @PathVariable Long id,
        @Valid @RequestBody BusinessGoalRequest request
    ) {
        return ApiResponse.ok(dashboardService.updateGoal(id, request));
    }

    @GetMapping("/v1/business-goals/progress")
    public ApiResponse<BusinessGoalProgressResponse> goalProgress(
        @RequestParam(required = false) Integer year,
        @RequestParam(required = false) Integer month
    ) {
        return ApiResponse.ok(dashboardService.goalProgress(year, month));
    }

    @GetMapping("/v1/reports/finance")
    public ApiResponse<FinanceReportResponse> financeReport(
        @RequestParam(required = false) Integer year,
        @RequestParam(required = false) Integer month
    ) {
        return ApiResponse.ok(dashboardService.financeReport(year, month));
    }

    @GetMapping("/v1/reports/members")
    public ApiResponse<MemberReportResponse> memberReport(
        @RequestParam(required = false) Integer year,
        @RequestParam(required = false) Integer month
    ) {
        return ApiResponse.ok(dashboardService.memberReport(year, month));
    }

    @GetMapping("/v1/notifications")
    public ApiResponse<List<NotificationResponse>> notifications() {
        return ApiResponse.ok(dashboardService.notifications());
    }

    @PatchMapping("/v1/notifications/{id}/read")
    public ApiResponse<NotificationResponse> markRead(@PathVariable String id) {
        return ApiResponse.ok(dashboardService.notifications().stream()
            .filter(notification -> notification.id().equals(id))
            .findFirst()
            .orElse(null));
    }
}
