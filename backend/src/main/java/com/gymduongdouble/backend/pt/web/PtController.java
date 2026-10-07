package com.gymduongdouble.backend.pt.web;

import com.gymduongdouble.backend.common.web.dto.ApiResponse;
import com.gymduongdouble.backend.pt.service.PtService;
import com.gymduongdouble.backend.pt.web.dto.BodyMeasurementRequest;
import com.gymduongdouble.backend.pt.web.dto.BodyMeasurementResponse;
import com.gymduongdouble.backend.pt.web.dto.MemberActivityLogRequest;
import com.gymduongdouble.backend.pt.web.dto.MemberActivityLogResponse;
import com.gymduongdouble.backend.pt.web.dto.PtAssignmentRequest;
import com.gymduongdouble.backend.pt.web.dto.PtAssignmentResponse;
import com.gymduongdouble.backend.pt.web.dto.PtGoalRequest;
import com.gymduongdouble.backend.pt.web.dto.PtGoalResponse;
import com.gymduongdouble.backend.pt.web.dto.PtMemberDetailResponse;
import com.gymduongdouble.backend.pt.web.dto.PtProfileRequest;
import com.gymduongdouble.backend.pt.web.dto.PtProfileResponse;
import com.gymduongdouble.backend.pt.web.dto.PtScheduleRequest;
import com.gymduongdouble.backend.pt.web.dto.PtScheduleResponse;
import com.gymduongdouble.backend.pt.web.dto.PtSessionLogRequest;
import com.gymduongdouble.backend.pt.web.dto.PtSessionLogResponse;
import com.gymduongdouble.backend.pt.web.dto.PtSessionPackageSummaryResponse;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/pt")
@RequiredArgsConstructor
public class PtController {

    private final PtService ptService;

    @GetMapping("/profiles")
    @PreAuthorize("hasAnyRole('OWNER', 'PT')")
    public ApiResponse<List<PtProfileResponse>> listProfiles() {
        return ApiResponse.ok(ptService.listProfiles());
    }

    @PostMapping("/profiles")
    @PreAuthorize("hasAnyRole('OWNER', 'PT')")
    public ApiResponse<PtProfileResponse> saveProfile(@Valid @RequestBody PtProfileRequest request) {
        return ApiResponse.created(ptService.saveProfile(request));
    }

    @GetMapping("/my-members")
    @PreAuthorize("hasAnyRole('OWNER', 'PT')")
    public ApiResponse<List<PtAssignmentResponse>> listMyMembers(@RequestParam(required = false) Long ptUserId) {
        return ApiResponse.ok(ptService.listMyMembers(ptUserId));
    }

    @PostMapping("/assignments")
    @PreAuthorize("hasAnyRole('OWNER', 'PT')")
    public ApiResponse<PtAssignmentResponse> assignMember(@Valid @RequestBody PtAssignmentRequest request) {
        return ApiResponse.created(ptService.assignMember(request));
    }

    @GetMapping("/schedules")
    @PreAuthorize("hasAnyRole('OWNER', 'PT')")
    public ApiResponse<List<PtScheduleResponse>> listSchedules(
        @RequestParam(required = false) Long ptUserId,
        @RequestParam(required = false) LocalDate fromDate,
        @RequestParam(required = false) LocalDate toDate
    ) {
        return ApiResponse.ok(ptService.listSchedules(ptUserId, fromDate, toDate));
    }

    @PostMapping("/schedules")
    @PreAuthorize("hasAnyRole('OWNER', 'PT')")
    public ApiResponse<PtScheduleResponse> createSchedule(@Valid @RequestBody PtScheduleRequest request) {
        return ApiResponse.created(ptService.createSchedule(request));
    }

    @DeleteMapping("/schedules/{scheduleId}")
    @PreAuthorize("hasAnyRole('OWNER', 'PT')")
    public ApiResponse<Void> deleteSchedule(@PathVariable Long scheduleId) {
        ptService.deleteSchedule(scheduleId);
        return ApiResponse.ok(null);
    }

    @GetMapping("/session-packages")
    @PreAuthorize("hasAnyRole('OWNER', 'PT')")
    public ApiResponse<List<PtSessionPackageSummaryResponse>> listSessionPackages(
        @RequestParam(required = false) Long memberId
    ) {
        return ApiResponse.ok(ptService.listSessionPackages(memberId));
    }

    @GetMapping("/members/{memberId}")
    @PreAuthorize("hasAnyRole('OWNER', 'PT')")
    public ApiResponse<PtMemberDetailResponse> getMemberDetail(@PathVariable Long memberId) {
        return ApiResponse.ok(ptService.getMemberDetail(memberId));
    }

    @PostMapping("/members/{memberId}/session-logs")
    @PreAuthorize("hasAnyRole('OWNER', 'PT')")
    public ApiResponse<PtSessionLogResponse> createSessionLog(
        @PathVariable Long memberId,
        @Valid @RequestBody PtSessionLogRequest request
    ) {
        return ApiResponse.created(ptService.createSessionLog(memberId, request));
    }

    @PostMapping("/members/{memberId}/activity-logs")
    @PreAuthorize("hasAnyRole('OWNER', 'PT')")
    public ApiResponse<MemberActivityLogResponse> createActivityLog(
        @PathVariable Long memberId,
        @Valid @RequestBody MemberActivityLogRequest request
    ) {
        return ApiResponse.created(ptService.createActivityLog(memberId, request));
    }

    @PostMapping("/members/{memberId}/body-measurements")
    @PreAuthorize("hasAnyRole('OWNER', 'PT')")
    public ApiResponse<BodyMeasurementResponse> createBodyMeasurement(
        @PathVariable Long memberId,
        @Valid @RequestBody BodyMeasurementRequest request
    ) {
        return ApiResponse.created(ptService.createBodyMeasurement(memberId, request));
    }

    @PostMapping("/members/{memberId}/goals")
    @PreAuthorize("hasAnyRole('OWNER', 'PT')")
    public ApiResponse<PtGoalResponse> createGoal(
        @PathVariable Long memberId,
        @Valid @RequestBody PtGoalRequest request
    ) {
        return ApiResponse.created(ptService.createGoal(memberId, request));
    }
}
