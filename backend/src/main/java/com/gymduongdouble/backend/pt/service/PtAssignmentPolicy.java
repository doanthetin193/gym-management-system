package com.gymduongdouble.backend.pt.service;

import com.gymduongdouble.backend.common.enums.PlanType;
import com.gymduongdouble.backend.common.enums.PtAssignmentStatus;
import com.gymduongdouble.backend.membership.service.MembershipLifecyclePolicy;
import com.gymduongdouble.backend.pt.domain.PtAssignment;
import com.gymduongdouble.backend.pt.repository.PtAssignmentRepository;
import com.gymduongdouble.backend.pt.repository.PtSessionPackageRepository;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PtAssignmentPolicy {

    private final PtAssignmentRepository ptAssignmentRepository;
    private final PtSessionPackageRepository ptSessionPackageRepository;
    private final MembershipLifecyclePolicy membershipLifecyclePolicy;

    public boolean hasEffectiveAssignment(Long memberId, Long ptUserId, LocalDate date) {
        return ptAssignmentRepository.findByMemberId(memberId).stream()
            .anyMatch(assignment -> assignment.getPtUser().getId().equals(ptUserId) && isEffective(assignment, date));
    }

    public boolean hasEffectiveAssignment(Long memberId, LocalDate date) {
        return ptAssignmentRepository.findByMemberId(memberId).stream()
            .anyMatch(assignment -> isEffective(assignment, date));
    }

    /**
     * Kiểm tra xem một Huấn luyện viên (PT) có quyền truy cập học viên vào ngày chỉ định hay không:
     * 
     * 1. Kiểm tra gói tập PT (hasAccessiblePtPackage):
     *    - Học viên phải có gói PT còn hiệu lực vào ngày xét. Khách tự tập Gym Standard bị từ chối ngay.
     * 2. Kiểm tra phân công (PtAssignment):
     *    - `assignments.isEmpty()`: Học viên này HOÀN TOÀN CHƯA TỪNG CÓ BẢN GHI PHÂN CÔNG NÀO trong DB
     *      (ví dụ khách mới toanh vừa mua gói PT tại quầy). Khi đó, các PT đều được xem hồ sơ để tiếp cận và nhận lớp.
     *    - LƯU Ý KHI REVIEW: `assignments.isEmpty()` KHÔNG PHẢI là "không có phân công hiệu lực".
     *      Nếu học viên đã từng có phân công trong quá khứ nhưng đã hết hạn (status = ENDED), danh sách
     *      này KHÔNG RỖNG (isEmpty = false) -> Bắt buộc phải qua vế `anyMatch`.
     *    - `anyMatch`: Đang được phân công cho chính PT này VÀ bản ghi phân công còn hiệu lực (isEffective).
     *    - Nếu đang gán cho PT khác hoặc phân công cũ đã hết hạn -> Trả về false (chống IDOR và tranh giành học viên).
     */
    public boolean canAccessMember(Long memberId, Long ptUserId, LocalDate date) {
        List<PtAssignment> assignments = ptAssignmentRepository.findByMemberId(memberId);
        // Bước 1: Khách phải có gói PT còn hiệu lực và chưa bị khóa bởi PT khác
        if (!hasAccessiblePtPackage(memberId, ptUserId, date)) {
            return false;
        }
        // Bước 2: Chưa từng phân công ai (khách mới) HOẶC đang phân công hiệu lực cho chính PT này
        return assignments.isEmpty() || assignments.stream()
            .anyMatch(assignment -> assignment.getPtUser().getId().equals(ptUserId) && isEffective(assignment, date));
    }

    /**
     * Kiểm tra học viên có gói tập PT phù hợp với PT này hay không:
     * - Gói đang có hiệu lực hôm nay (membershipLifecyclePolicy.isEffective).
     * - Gói thuộc loại PT (PlanType.PT).
     * - Gói chưa gán PT nào (ptUser == null) HOẶC gán đúng cho PT đang đăng nhập (ptUser.id == ptUserId).
     */
    public boolean hasAccessiblePtPackage(Long memberId, Long ptUserId, LocalDate date) {
        return ptSessionPackageRepository.findByMemberIdOrderByStartDateDesc(memberId).stream()
            .anyMatch(sessionPackage -> membershipLifecyclePolicy.isEffective(sessionPackage, date)
                && sessionPackage.getMembership().getPlan().getPlanType() == PlanType.PT
                && (sessionPackage.getPtUser() == null || sessionPackage.getPtUser().getId().equals(ptUserId))
            );
    }

    /**
     * Kiểm tra bản ghi phân công PT có đang hiệu lực:
     * - Trạng thái là ACTIVE.
     * - Nằm trong khoảng ngày hiệu lực: startDate <= date <= (endDate == null || endDate >= date).
     */
    public boolean isEffective(PtAssignment assignment, LocalDate date) {
        return effectiveStatus(assignment, date) == PtAssignmentStatus.ACTIVE
            && !assignment.getStartDate().isAfter(date)
            && (assignment.getEndDate() == null || !assignment.getEndDate().isBefore(date));
    }

    public PtAssignmentStatus effectiveStatus(PtAssignment assignment, LocalDate date) {
        if (assignment.getStatus() != PtAssignmentStatus.ACTIVE) {
            return assignment.getStatus();
        }
        LocalDate endDate = assignment.getEndDate() == null ? inferredEndDate(assignment) : assignment.getEndDate();
        return endDate != null && endDate.isBefore(date)
            ? PtAssignmentStatus.ENDED
            : PtAssignmentStatus.ACTIVE;
    }

    private LocalDate inferredEndDate(PtAssignment assignment) {
        return ptSessionPackageRepository.findByMemberIdOrderByStartDateDesc(assignment.getMember().getId()).stream()
            .filter(sessionPackage -> sessionPackage.getPtUser() != null
                && sessionPackage.getPtUser().getId().equals(assignment.getPtUser().getId()))
            .filter(sessionPackage -> !sessionPackage.getStartDate().isAfter(assignment.getStartDate()))
            .filter(sessionPackage -> !sessionPackage.getEndDate().isBefore(assignment.getStartDate()))
            .map(sessionPackage -> sessionPackage.getEndDate())
            .max(LocalDate::compareTo)
            .orElse(null);
    }
}
