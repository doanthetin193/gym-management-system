package com.gymduongdouble.backend.dashboard.web;

import com.gymduongdouble.backend.common.web.dto.ApiResponse;
import com.gymduongdouble.backend.dashboard.service.DashboardService;
import com.gymduongdouble.backend.dashboard.web.dto.FinanceReportResponse;
import com.gymduongdouble.backend.dashboard.web.dto.MemberReportResponse;
import com.gymduongdouble.backend.dashboard.web.dto.NotificationResponse;
import com.gymduongdouble.backend.dashboard.web.dto.OwnerDashboardResponse;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.List;
import org.springframework.validation.annotation.Validated;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@Validated
@PreAuthorize("hasRole('OWNER')")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/v1/dashboard/owner")
    public ApiResponse<OwnerDashboardResponse> ownerDashboard(
        @RequestParam(required = false) @Min(2020) @Max(2100) Integer year,
        @RequestParam(required = false) @Min(1) @Max(12) Integer month
    ) {
        return ApiResponse.ok(dashboardService.ownerDashboard(year, month));
    }

    @GetMapping("/v1/reports/finance")
    public ApiResponse<FinanceReportResponse> financeReport(
        @RequestParam(required = false) @Min(2020) @Max(2100) Integer year,
        @RequestParam(required = false) @Min(1) @Max(12) Integer month
    ) {
        return ApiResponse.ok(dashboardService.financeReport(year, month));
    }

    @GetMapping("/v1/reports/members")
    public ApiResponse<MemberReportResponse> memberReport(
        @RequestParam(required = false) @Min(2020) @Max(2100) Integer year,
        @RequestParam(required = false) @Min(1) @Max(12) Integer month
    ) {
        return ApiResponse.ok(dashboardService.memberReport(year, month));
    }

    @GetMapping("/v1/notifications")
    public ApiResponse<List<NotificationResponse>> notifications() {
        return ApiResponse.ok(dashboardService.notifications());
    }
}
