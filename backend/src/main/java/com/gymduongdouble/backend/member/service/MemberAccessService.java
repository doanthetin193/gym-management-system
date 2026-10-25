package com.gymduongdouble.backend.member.service;

import com.gymduongdouble.backend.common.security.AuthenticatedUser;
import com.gymduongdouble.backend.common.security.SecurityUtils;
import com.gymduongdouble.backend.common.time.AppClock;
import com.gymduongdouble.backend.common.enums.PlanType;
import com.gymduongdouble.backend.common.enums.MemberStatus;
import com.gymduongdouble.backend.member.repository.MemberRepository;
import com.gymduongdouble.backend.pt.service.PtAssignmentPolicy;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

/**
 * Dịch vụ kiểm soát quyền truy cập chi tiết đến từng bản ghi Hội viên (Object-Level Authorization):
 * 
 * [BẢO MẬT CHỐNG LỖ HỔNG IDOR (Insecure Direct Object References)]:
 * - Ngăn chặn tình trạng PT sửa ID trên URL/API để xem trộm thông tin cá nhân, chỉ số thể hình,
 *   tiền nợ hoặc lịch sử tập luyện của học viên thuộc PT khác hoặc khách tự tập Gym.
 * - OWNER: Toàn quyền truy cập mọi hội viên (Full Access).
 * - PT: Chỉ được truy cập khi hội viên đang ACTIVE VÀ (chưa được phân công ai HOẶC phân công cho chính mình).
 */
@Service
@RequiredArgsConstructor
public class MemberAccessService {

    private final MemberRepository memberRepository;
    private final PtAssignmentPolicy ptAssignmentPolicy;

    /**
     * Kiểm tra người dùng hiện tại có quyền truy cập hồ sơ hội viên này hay không:
     * 1. Nếu là OWNER -> Cho phép luôn (toàn quyền hệ thống).
     * 2. Nếu là PT -> Bắt buộc hội viên phải ACTIVE (không điều phối khách INACTIVE/ARCHIVED).
     * 3. Chuyển tiếp cho PtAssignmentPolicy kiểm tra gói PT và hợp đồng phân công.
     */
    public boolean canAccessMember(Long memberId) {
        // Chủ phòng (OWNER) có toàn quyền truy cập mọi hồ sơ
        if (hasRole("OWNER")) {
            return true;
        }
        Long currentUserId = SecurityUtils.currentUserIdOrNull();
        if (currentUserId == null || !hasRole("PT")) {
            return false;
        }
        // Với PT: Chỉ cho phép truy cập nếu hồ sơ hội viên đang ACTIVE
        return memberRepository.findById(memberId)
            .filter(member -> member.getStatus() == MemberStatus.ACTIVE)
            .map(member -> ptAssignmentPolicy.canAccessMember(memberId, currentUserId, AppClock.today()))
            .orElse(false);
    }

    /**
     * Chặn đứng thao tác nếu không có quyền truy cập (ném HTTP 403 AccessDeniedException).
     */
    public void ensureCanAccessMember(Long memberId) {
        if (!canAccessMember(memberId)) {
            throw new AccessDeniedException("PT chỉ được thao tác với khách chưa có PT hoặc khách được phân công cho chính mình.");
        }
    }

    /**
     * Ngoại lệ nghiệp vụ khi tạo gói tập mới:
     * Cho phép PT tạo mới gói tập loại PT cho hội viên tự tập tự do,
     * MIỄN LÀ hội viên đó hiện tại chưa bị phân công cho bất kỳ PT nào khác.
     */
    public void ensureCanCreateMembership(Long memberId, PlanType planType) {
        if (canAccessMember(memberId)) {
            return;
        }
        boolean canStartPtEnrollment = planType == PlanType.PT
            && hasRole("PT")
            && memberRepository.findById(memberId)
                .filter(member -> member.getStatus() == MemberStatus.ACTIVE)
                .map(member -> !ptAssignmentPolicy.hasEffectiveAssignment(memberId, AppClock.today()))
                .orElse(false);
        if (!canStartPtEnrollment) {
            throw new AccessDeniedException("PT chỉ có thể đăng ký gói PT cho khách chưa được phân công hoặc khách do mình phụ trách.");
        }
    }

    private boolean hasRole(String roleCode) {
        return SecurityUtils.currentUser()
            .stream()
            .map(AuthenticatedUser::getAuthorities)
            .flatMap(authorities -> authorities.stream())
            .anyMatch(authority -> authority.getAuthority().equals("ROLE_" + roleCode));
    }

}
