package com.gymduongdouble.backend.membership.web;

import com.gymduongdouble.backend.common.web.dto.ApiResponse;
import com.gymduongdouble.backend.membership.service.MembershipPlanService;
import com.gymduongdouble.backend.membership.web.dto.MembershipPlanRequest;
import com.gymduongdouble.backend.membership.web.dto.MembershipPlanResponse;
import com.gymduongdouble.backend.membership.web.dto.UpdateMembershipPlanActiveRequest;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * API Quản trị Nội bộ Danh mục Gói tập (Bắt buộc Token xác thực):
 * 
 * [PHÂN QUYỀN RBAC]:
 * - POST, GET /all, PUT /{id}/active: Dành riêng cho Chủ phòng (OWNER).
 * - GET: Cho phép cả OWNER và PT lấy danh sách gói active = true để bán gói tại quầy.
 */
@RestController
@RequestMapping("/v1/membership-plans")
@RequiredArgsConstructor
public class MembershipPlanController {

    private final MembershipPlanService membershipPlanService;

    /**
     * Tạo mới gói tập mẫu: Dành riêng cho OWNER.
     */
    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    public ApiResponse<MembershipPlanResponse> create(@Valid @RequestBody MembershipPlanRequest request) {
        return ApiResponse.created(membershipPlanService.create(request));
    }

    /**
     * Lấy danh sách các gói đang kinh doanh (active = true):
     * Cả OWNER và PT đều được phép xem để chọn gói khi tạo hợp đồng cho hội viên.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'PT')")
    public ApiResponse<List<MembershipPlanResponse>> listActive() {
        return ApiResponse.ok(membershipPlanService.listActive());
    }

    /**
     * Lấy toàn bộ danh mục gói tập (kể cả active = false):
     * Dành riêng cho OWNER xem và cấu hình tại màn hình Cài đặt hệ thống.
     */
    @GetMapping("/all")
    @PreAuthorize("hasRole('OWNER')")
    public ApiResponse<List<MembershipPlanResponse>> listAll() {
        return ApiResponse.ok(membershipPlanService.listAll());
    }

    /**
     * Bật/tắt trạng thái kinh doanh của gói tập:
     * Dành riêng cho OWNER. Tuyệt đối không có API DELETE để tránh xóa dữ liệu quá khứ.
     */
    @PutMapping("/{id}/active")
    @PreAuthorize("hasRole('OWNER')")
    public ApiResponse<MembershipPlanResponse> updateActive(
        @PathVariable Long id,
        @Valid @RequestBody UpdateMembershipPlanActiveRequest request
    ) {
        return ApiResponse.ok(membershipPlanService.updateActive(id, request.active()));
    }
}
