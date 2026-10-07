package com.gymduongdouble.backend.user.web;

import com.gymduongdouble.backend.common.enums.UserStatus;
import com.gymduongdouble.backend.common.security.AuthenticatedUser;
import com.gymduongdouble.backend.common.security.SecurityUtils;
import com.gymduongdouble.backend.common.web.dto.ApiResponse;
import com.gymduongdouble.backend.user.service.TeamUserService;
import com.gymduongdouble.backend.user.web.dto.CreateTeamUserRequest;
import com.gymduongdouble.backend.user.web.dto.ResetTeamPasswordRequest;
import com.gymduongdouble.backend.user.web.dto.TeamUserResponse;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/settings/team-users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('OWNER')")
public class TeamUserController {

    private final TeamUserService teamUserService;

    @GetMapping
    public ApiResponse<List<TeamUserResponse>> listTeamUsers() {
        return ApiResponse.ok(teamUserService.listTeamUsers());
    }

    @PostMapping
    public ApiResponse<TeamUserResponse> createTeamUser(@Valid @RequestBody CreateTeamUserRequest request) {
        return ApiResponse.created(teamUserService.createTeamUser(request));
    }

    @PutMapping("/{id}/role")
    public ApiResponse<TeamUserResponse> updateRole(
        @PathVariable Long id,
        @RequestBody Map<String, String> payload
    ) {
        String roleCode = payload.getOrDefault("roleCode", "PT");
        AuthenticatedUser currentUser = currentUser();
        return ApiResponse.ok(teamUserService.updateRole(id, roleCode, currentUser));
    }

    @PutMapping("/{id}/status")
    public ApiResponse<TeamUserResponse> updateStatus(
        @PathVariable Long id,
        @RequestBody Map<String, String> payload
    ) {
        String statusStr = payload.getOrDefault("status", "ACTIVE");
        UserStatus status = "LOCKED".equalsIgnoreCase(statusStr) ? UserStatus.LOCKED : UserStatus.ACTIVE;
        AuthenticatedUser currentUser = currentUser();
        return ApiResponse.ok(teamUserService.updateStatus(id, status, currentUser));
    }

    @PostMapping("/{id}/reset-password")
    public ApiResponse<TeamUserResponse> resetPassword(
        @PathVariable Long id,
        @Valid @RequestBody ResetTeamPasswordRequest request
    ) {
        return ApiResponse.ok(teamUserService.resetPassword(id, request.newPassword()));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteTeamUser(@PathVariable Long id) {
        AuthenticatedUser currentUser = currentUser();
        teamUserService.deleteTeamUser(id, currentUser);
        return ApiResponse.ok(null);
    }

    private AuthenticatedUser currentUser() {
        return SecurityUtils.currentUser()
            .orElseThrow(() -> new AccessDeniedException("Bạn cần đăng nhập để thực hiện thao tác này."));
    }
}
