package com.gymduongdouble.backend.membership.service;

import com.gymduongdouble.backend.common.enums.MembershipStatus;
import com.gymduongdouble.backend.common.enums.SessionPackageStatus;
import com.gymduongdouble.backend.membership.domain.MemberMembership;
import com.gymduongdouble.backend.pt.domain.PtSessionPackage;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;

/**
 * Chính sách vòng đời và tính toán trạng thái hiệu lực của Gói tập (Membership) & Gói tập với PT:
 * 
 * [KIẾN TRÚC ON-THE-FLY EXPIRATION]:
 * - Thay vì phải chạy cron job lúc nửa đêm quét toàn bộ DB để update status = EXPIRED (rất nặng và có độ trễ),
 *   hệ thống tính toán trạng thái hiệu lực động ngay tại thời điểm gọi (theo AppClock.today()).
 * - Tách biệt logic ngày tháng nghiệp vụ khỏi entity model.
 */
@Service
public class MembershipLifecyclePolicy {

    /**
     * Kiểm tra gói tập có đang thực sự có hiệu lực vào ngày được chỉ định (thường là hôm nay) hay không:
     * - Trạng thái bắt buộc phải là ACTIVE. Các trạng thái PENDING_PAYMENT (chờ thanh toán), EXPIRED (hết hạn),
     *   hoặc CANCELLED (đã hủy) đều KHÔNG được coi là có hiệu lực để vào phòng tập.
     * - Ngày chỉ định phải nằm trong khoảng: startDate <= date <= endDate.
     */
    public boolean isEffective(MemberMembership membership, LocalDate date) {
        MembershipStatus status = effectiveStatus(membership, date);
        return status == MembershipStatus.ACTIVE
            && !membership.getStartDate().isAfter(date)
            && !membership.getEndDate().isBefore(date);
    }

    /**
     * Xác định trạng thái thực tế của gói tập:
     * - Nếu trạng thái gốc là CANCELLED -> Giữ nguyên CANCELLED.
     * - Nếu ngày kết thúc đã qua (endDate < date) -> Trả về EXPIRED (hết hạn động).
     * - Ngược lại -> Giữ nguyên trạng thái hiện tại.
     */
    public MembershipStatus effectiveStatus(MemberMembership membership, LocalDate date) {
        if (membership.getStatus() == MembershipStatus.CANCELLED) {
            return MembershipStatus.CANCELLED;
        }
        return membership.getEndDate().isBefore(date) ? MembershipStatus.EXPIRED : membership.getStatus();
    }

    public SessionPackageStatus effectiveStatus(PtSessionPackage sessionPackage, LocalDate date) {
        MembershipStatus membershipStatus = effectiveStatus(sessionPackage.getMembership(), date);
        if (membershipStatus == MembershipStatus.CANCELLED) {
            return SessionPackageStatus.CANCELLED;
        }
        if (membershipStatus == MembershipStatus.EXPIRED) {
            return SessionPackageStatus.EXPIRED;
        }
        if (sessionPackage.getStatus() == SessionPackageStatus.CANCELLED
            || sessionPackage.getStatus() == SessionPackageStatus.COMPLETED) {
            return sessionPackage.getStatus();
        }
        return sessionPackage.getEndDate().isBefore(date)
            ? SessionPackageStatus.EXPIRED
            : sessionPackage.getStatus();
    }

    public boolean isEffective(PtSessionPackage sessionPackage, LocalDate date) {
        return effectiveStatus(sessionPackage, date) == SessionPackageStatus.ACTIVE
            && !sessionPackage.getStartDate().isAfter(date)
            && !sessionPackage.getEndDate().isBefore(date)
            && effectiveStatus(sessionPackage.getMembership(), date) == MembershipStatus.ACTIVE;
    }

    /**
     * Thuật toán chọn Gói Tập Đại Diện (Preferred Membership) để hiển thị trên danh sách hội viên:
     * Một hội viên có thể có nhiều gói tập trong lịch sử. Hàm này chọn ra duy nhất 1 gói tối ưu nhất theo 3 mức:
     * 
     * 1. [MỨC 1 - Đang tập]: Gói có hiệu lực hôm nay (isEffective) -> Lấy gói có ngày bắt đầu/kết thúc mới nhất.
     * 2. [MỨC 2 - Gói tương lai]: Nếu hôm nay không có gói nào hiệu lực -> Lấy gói mua trước sắp bắt đầu sớm nhất (startDate > today).
     * 3. [MỨC 3 - Gói quá khứ]: Nếu không có cả gói tương lai -> Lấy gói cũ vừa mới hết hạn gần đây nhất (endDate < today).
     */
    public Optional<MemberMembership> preferredMembership(List<MemberMembership> memberships, LocalDate date) {
        List<MemberMembership> available = memberships.stream()
            .filter(membership -> membership.getStatus() != MembershipStatus.CANCELLED)
            .toList();

        return available.stream()
            // Ưu tiên 1: Gói đang có hiệu lực hôm nay
            .filter(membership -> isEffective(membership, date))
            .max(Comparator.comparing(MemberMembership::getStartDate).thenComparing(MemberMembership::getEndDate))
            // Ưu tiên 2: Gói mua trước sắp bắt đầu
            .or(() -> available.stream()
                .filter(membership -> membership.getStartDate().isAfter(date))
                .min(Comparator.comparing(MemberMembership::getStartDate).thenComparing(MemberMembership::getEndDate)))
            // Ưu tiên 3: Gói cũ vừa mới hết hạn gần nhất
            .or(() -> available.stream()
                .filter(membership -> membership.getEndDate().isBefore(date))
                .max(Comparator.comparing(MemberMembership::getEndDate).thenComparing(MemberMembership::getStartDate)));
    }
}
