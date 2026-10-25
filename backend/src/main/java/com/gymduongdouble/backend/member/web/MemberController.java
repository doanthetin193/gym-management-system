package com.gymduongdouble.backend.member.web;

import com.gymduongdouble.backend.common.web.dto.ApiResponse;
import com.gymduongdouble.backend.common.web.dto.PageResponse;
import com.gymduongdouble.backend.member.service.MemberService;
import com.gymduongdouble.backend.member.web.dto.CreatePortalAccountRequest;
import com.gymduongdouble.backend.member.web.dto.MemberCreateRequest;
import com.gymduongdouble.backend.member.web.dto.MemberDetailResponse;
import com.gymduongdouble.backend.member.web.dto.MemberListFilter;
import com.gymduongdouble.backend.member.web.dto.MemberListStatisticsResponse;
import com.gymduongdouble.backend.member.web.dto.MemberResponse;
import com.gymduongdouble.backend.member.web.dto.MemberSummaryResponse;
import com.gymduongdouble.backend.member.web.dto.MemberUpdateRequest;
import com.gymduongdouble.backend.member.web.dto.ResetPortalAccountPasswordRequest;
import com.gymduongdouble.backend.member.web.dto.UpdatePortalAccountStatusRequest;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/members")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;

    /**
     * [LUỒNG TẠO HỒ SƠ - BƯỚC 1: TIẾP NHẬN TẠI CONTROLLER]:
     * - @PreAuthorize("hasAnyRole('OWNER', 'PT')"): Cả Chủ phòng và HLV đều có quyền tiếp nhận thông tin khách tại quầy.
     * - @Valid: Kích hoạt Bean Validation trên MemberCreateRequest (kiểm tra @NotBlank cho họ tên và SĐT).
     * - ApiResponse.created(): Trả về chuẩn mã HTTP 201 Created để báo hiệu tài nguyên mới đã được tạo thành công.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'PT')")
    public ApiResponse<MemberResponse> create(@Valid @RequestBody MemberCreateRequest request) {
        return ApiResponse.created(memberService.create(request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'PT')")
    public ApiResponse<MemberDetailResponse> get(@PathVariable Long id) {
        return ApiResponse.ok(memberService.getDetail(id));
    }

    /**
     * Cập nhật thông tin hồ sơ hội viên:
     * - Phân quyền: Cả OWNER và PT đều được phép gọi (PT dùng để cập nhật Zalo/ghi chú cho học viên của mình).
     * - Lưu ý bảo mật: Ở tầng Service, chỉ OWNER mới có quyền đổi trường 'status' (ACTIVE, INACTIVE, ARCHIVED).
     *   Nếu PT gửi yêu cầu đổi status sẽ bị chặn bởi AccessDeniedException.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'PT')")
    public ApiResponse<MemberResponse> update(@PathVariable Long id, @Valid @RequestBody MemberUpdateRequest request) {
        return ApiResponse.ok(memberService.update(id, request));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'PT')")
    public ApiResponse<List<MemberSummaryResponse>> list(
        @RequestParam(required = false) String keyword,
        @RequestParam(defaultValue = "ALL") MemberListFilter filter
    ) {
        return ApiResponse.ok(memberService.list(keyword, filter));
    }

    /**
     * API phân trang danh sách hội viên:
     * - page: Số thứ tự trang (zero-based: 0 là trang đầu tiên).
     * - size: Số lượng phần tử mỗi trang (mặc định 10).
     */
    @GetMapping("/page")
    @PreAuthorize("hasAnyRole('OWNER', 'PT')")
    public ApiResponse<PageResponse<MemberSummaryResponse>> listPage(
        @RequestParam(required = false) String keyword,
        @RequestParam(defaultValue = "ALL") MemberListFilter filter,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        return ApiResponse.ok(memberService.listPage(keyword, filter, page, size));
    }

    @GetMapping("/statistics")
    @PreAuthorize("hasAnyRole('OWNER', 'PT')")
    public ApiResponse<MemberListStatisticsResponse> statistics() {
        return ApiResponse.ok(memberService.listStatistics());
    }

    // =========================================================================
    // NHÓM API QUẢN LÝ TÀI KHOẢN PORTAL HỘI VIÊN:
    // - Giới hạn nghiêm ngặt: Chỉ Chủ phòng (@PreAuthorize("hasRole('OWNER')")) mới có quyền quản lý.
    // - PT hoàn toàn không có quyền cấp phát, mở khóa, đổi mật khẩu hay hủy liên kết Portal của học viên.
    // =========================================================================

    @PostMapping("/{id}/portal-account")
    @PreAuthorize("hasRole('OWNER')")
    public ApiResponse<MemberDetailResponse> createPortalAccount(
        @PathVariable Long id,
        @RequestBody(required = false) CreatePortalAccountRequest payload
    ) {
        String password = payload != null ? payload.password() : null;
        return ApiResponse.created(memberService.createPortalAccount(id, password));
    }

    @PutMapping("/{id}/portal-account/status")
    @PreAuthorize("hasRole('OWNER')")
    public ApiResponse<MemberDetailResponse> updatePortalAccountStatus(
        @PathVariable Long id,
        @Valid @RequestBody UpdatePortalAccountStatusRequest payload
    ) {
        return ApiResponse.ok(memberService.updatePortalAccountStatus(id, payload.status()));
    }

    @PostMapping("/{id}/portal-account/reset-password")
    @PreAuthorize("hasRole('OWNER')")
    public ApiResponse<MemberDetailResponse> resetPortalAccountPassword(
        @PathVariable Long id,
        @RequestBody(required = false) ResetPortalAccountPasswordRequest payload
    ) {
        String newPassword = payload != null ? payload.newPassword() : null;
        return ApiResponse.ok(memberService.resetPortalAccountPassword(id, newPassword));
    }

    @DeleteMapping("/{id}/portal-account")
    @PreAuthorize("hasRole('OWNER')")
    public ApiResponse<MemberDetailResponse> deletePortalAccount(@PathVariable Long id) {
        return ApiResponse.ok(memberService.deletePortalAccount(id));
    }
}
