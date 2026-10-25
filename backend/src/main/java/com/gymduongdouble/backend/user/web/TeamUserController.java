package com.gymduongdouble.backend.user.web;

import com.gymduongdouble.backend.common.security.AuthenticatedUser;
import com.gymduongdouble.backend.common.security.SecurityUtils;
import com.gymduongdouble.backend.common.web.dto.ApiResponse;
import com.gymduongdouble.backend.user.service.TeamUserService;
import com.gymduongdouble.backend.user.web.dto.CreateTeamUserRequest;
import com.gymduongdouble.backend.user.web.dto.ResetTeamPasswordRequest;
import com.gymduongdouble.backend.user.web.dto.TeamUserResponse;
import com.gymduongdouble.backend.user.web.dto.UpdateTeamRoleRequest;
import com.gymduongdouble.backend.user.web.dto.UpdateTeamStatusRequest;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller quản lý tài khoản đội ngũ nhân sự nội bộ (Team Users Management).
 * <p>
 * PHÂN QUYỀN & PHẠM VI (Authorization Scope):
 * 1. OWNER-Only: Toàn bộ controller được bảo vệ bởi `@PreAuthorize("hasRole('OWNER')")`.
 * 2. Phạm vi quản lý: Chỉ quản lý 2 vai trò nhân sự nội bộ: Chủ phòng (`OWNER`) và Huấn luyện viên (`PT`).
 * 3. Chốt an toàn: Mọi thao tác đổi vai trò, khóa tài khoản đều được đối soát để bảo vệ Chủ phòng
 *    đang hoạt động cuối cùng và ngăn chặn người dùng tự thao tác trên chính mình.
 */
@RestController
@RequestMapping("/v1/settings/team-users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('OWNER')")
public class TeamUserController {

    private final TeamUserService teamUserService;

    /**
     * Lấy danh sách toàn bộ nhân sự nội bộ (Chủ phòng và PT) để hiển thị lên bảng quản lý.
     */
    @GetMapping
    public ApiResponse<List<TeamUserResponse>> listTeamUsers() {
        return ApiResponse.ok(teamUserService.listTeamUsers());
    }

    /**
     * Tạo tài khoản nhân sự mới (Chủ phòng hoặc Huấn luyện viên PT).
     * Tự động sinh PtProfile cho nhân sự để có thể nhận lịch dạy.
     */
    @PostMapping
    public ApiResponse<TeamUserResponse> createTeamUser(@Valid @RequestBody CreateTeamUserRequest request) {
        return ApiResponse.created(teamUserService.createTeamUser(request));
    }

    /**
     * Thay đổi vai trò nhân sự (VD: Nâng cấp PT lên OWNER hoặc hạ OWNER xuống PT).
     * Có chốt chặn chống tự đổi quyền chính mình và bảo vệ OWNER cuối cùng.
     */
    @PutMapping("/{id}/role")
    public ApiResponse<TeamUserResponse> updateRole(
        @PathVariable Long id,
        @Valid @RequestBody UpdateTeamRoleRequest request
    ) {
        AuthenticatedUser currentUser = currentUser();
        return ApiResponse.ok(teamUserService.updateRole(id, request.roleCode(), currentUser));
    }

    /**
     * Khóa hoặc mở khóa tài khoản nhân sự (ACTIVE / LOCKED).
     * Khi tài khoản bị khóa, hồ sơ PT cũng tự động ngưng hoạt động.
     */
    @PutMapping("/{id}/status")
    public ApiResponse<TeamUserResponse> updateStatus(
        @PathVariable Long id,
        @Valid @RequestBody UpdateTeamStatusRequest request
    ) {
        AuthenticatedUser currentUser = currentUser();
        return ApiResponse.ok(teamUserService.updateStatus(id, request.status(), currentUser));
    }

    /**
     * Chủ phòng đặt lại mật khẩu cho nhân sự (Admin Reset).
     * Tự động thu hồi token (authVersion++) để đăng xuất nhân sự khỏi mọi thiết bị.
     */
    @PostMapping("/{id}/reset-password")
    public ApiResponse<TeamUserResponse> resetPassword(
        @PathVariable Long id,
        @Valid @RequestBody ResetTeamPasswordRequest request
    ) {
        return ApiResponse.ok(teamUserService.resetPassword(id, request.newPassword()));
    }

    private AuthenticatedUser currentUser() {
        return SecurityUtils.currentUser()
            .orElseThrow(() -> new AccessDeniedException("Bạn cần đăng nhập để thực hiện thao tác này."));
    }
}
