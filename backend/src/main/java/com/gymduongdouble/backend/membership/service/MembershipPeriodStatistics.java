package com.gymduongdouble.backend.membership.service;

import com.gymduongdouble.backend.common.enums.MembershipStatus;
import com.gymduongdouble.backend.membership.domain.MemberMembership;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

/**
 * Thành phần thống kê tăng trưởng hội viên theo kỳ báo cáo (Period Statistics):
 * 
 * [NGUYÊN LÝ PHÂN LOẠI HỘI VIÊN MỚI VS GIA HẠN]:
 * 1. Gom nhóm toàn bộ gói tập chưa hủy của từng hội viên và sắp xếp theo ngày bắt đầu (startDate ASC).
 * 2. Lượt mua đầu tiên trong lịch sử của hội viên (vòng lặp i == 0):
 *    - Nếu startDate nằm trong kỳ [start, end] -> Tính là Hội viên mới (newMembers).
 * 3. Từ lượt mua thứ hai trở đi (i > 0):
 *    - Nếu startDate nằm trong kỳ [start, end] -> Tính là Hội viên gia hạn (renewedMembers).
 * 4. Dùng Set<Long> để lưu trữ memberId: Đảm bảo nếu một khách gia hạn nhiều lần trong cùng 1 kỳ báo cáo
 *    thì chỉ được đếm là 1 khách gia hạn duy nhất, tránh phóng đại số liệu kinh doanh.
 */
@Component
public class MembershipPeriodStatistics {

    public Counts count(List<MemberMembership> memberships, LocalDate start, LocalDate end) {
        // Nhóm các gói tập theo từng hội viên (loại trừ các gói đã bị hủy)
        Map<Long, List<MemberMembership>> byMember = memberships.stream()
            .filter(membership -> membership.getStatus() != MembershipStatus.CANCELLED)
            .collect(Collectors.groupingBy(membership -> membership.getMember().getId()));
        Set<Long> newMembers = new HashSet<>();
        Set<Long> renewedMembers = new HashSet<>();
        Comparator<MemberMembership> order = Comparator.comparing(MemberMembership::getStartDate)
            .thenComparing(MemberMembership::getId);

        byMember.forEach((memberId, memberMemberships) -> {
            List<MemberMembership> sorted = memberMemberships.stream().sorted(order).toList();
            for (int i = 0; i < sorted.size(); i++) {
                LocalDate date = sorted.get(i).getStartDate();
                // Kiểm tra lượt mua này có bắt đầu trong kỳ báo cáo hay không
                if (!date.isBefore(start) && !date.isAfter(end)) {
                    // Lần đầu tiên trong đời (i == 0) là Khách Mới; từ lần thứ 2 trở đi (i > 0) là Gia Hạn
                    (i == 0 ? newMembers : renewedMembers).add(memberId);
                }
            }
        });
        return new Counts(newMembers.size(), renewedMembers.size());
    }

    public record Counts(long newMembers, long renewedMembers) {}
}
