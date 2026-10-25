package com.gymduongdouble.backend.member.web;

import com.gymduongdouble.backend.common.security.AuthenticatedUser;
import com.gymduongdouble.backend.common.web.dto.ApiResponse;
import com.gymduongdouble.backend.member.service.MemberPortalService;
import com.gymduongdouble.backend.member.web.dto.MemberPortalResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller phục vụ Cổng thông tin Hội viên (Member Portal).
 * <p>
 * THIẾT KẾ BẢO MẬT CHỐNG IDOR 100% (Insecure Direct Object References):
 * 1. Định danh bám sát Token JWT:
 *    - Endpoint `/me` hoàn toàn KHÔNG nhận `memberId` hay `userId` từ phía client gửi lên (query/path param).
 *    - Danh tính người dùng được trích xuất an toàn từ chữ ký số JWT thông qua `@AuthenticationPrincipal AuthenticatedUser user`.
 * 2. Phân quyền chặt chẽ:
 *    - Yêu cầu người dùng bắt buộc phải sở hữu quyền `hasRole('MEMBER')`.
 *    - Ngăn chặn triệt để hành vi giả mạo ID hoặc can thiệp tham số để xem trộm dữ liệu nhạy cảm
 *      (chỉ số cơ thể InBody, tiến trình tập luyện, lịch sử tài chính, công nợ) của hội viên khác.
 */
@RestController
@RequestMapping("/v1/member-portal")
@RequiredArgsConstructor
public class MemberPortalController {

    private final MemberPortalService memberPortalService;

    /**
     * Lấy toàn bộ thông tin cá nhân và dữ liệu luyện tập của chính hội viên đang đăng nhập.
     * <p>
     * Dữ liệu trả về (MemberPortalResponse) gồm:
     * - Hồ sơ cá nhân (Profile).
     * - Gói tập đang hiệu lực và lịch sử gói cũ.
     * - Số buổi PT còn lại, lịch tập sắp tới, nhật ký các buổi đã tập.
     * - Số đo InBody theo thời gian, mục tiêu luyện tập.
     * - Lịch sử phiếu thu thanh toán và tổng công nợ còn thiếu.
     */
    @GetMapping("/me")
    @PreAuthorize("hasRole('MEMBER')")
    public ApiResponse<MemberPortalResponse> me(@AuthenticationPrincipal AuthenticatedUser user) {
        return ApiResponse.ok(memberPortalService.getPortal(user.getId()));
    }
}
