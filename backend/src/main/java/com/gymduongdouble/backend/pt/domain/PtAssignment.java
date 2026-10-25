package com.gymduongdouble.backend.pt.domain;

import com.gymduongdouble.backend.common.domain.AuditableEntity;
import com.gymduongdouble.backend.common.enums.PtAssignmentStatus;
import com.gymduongdouble.backend.member.domain.Member;
import com.gymduongdouble.backend.user.domain.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Entity đại diện cho bản ghi Phân công Huấn luyện viên phụ trách Hội viên (PT Assignment).
 * <p>
 * THIẾT KẾ ĐỘC LẬP TRONG HỆ SINH THÁI PT:
 * 1. Phân biệt 4 thực thể cốt lõi:
 *    - `PtSessionPackage`: "Chiếc ví" định mức số buổi còn lại và thời hạn gói.
 *    - `PtAssignment` (Entity này): "Hợp đồng trách nhiệm" - ghi nhận HLV nào phụ trách học viên nào,
 *      từ ngày nào đến ngày nào (startDate -> endDate). Đây là lịch sử phân công huấn luyện.
 *    - `PtSchedule`: "Kế hoạch thời gian biểu" (Lịch hẹn cụ thể). Đặt lịch KHÔNG trừ buổi tập.
 *    - `PtSessionLog`: "Bằng chứng thực thi" (Nhật ký buổi tập thực tế). Chỉ khi ghi log mới tiêu hao buổi tập.
 * 2. Nguyên tắc "Không viết lại quá khứ":
 *    - Khi đổi HLV phụ trách (reassign), bản ghi phân công cũ được chốt kết thúc (status = ENDED, endDate = today)
 *      và một bản ghi PtAssignment mới được tạo ra cho HLV mới, giữ nguyên toàn vẹn lịch sử.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "pt_assignments")
public class PtAssignment extends AuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pt_user_id", nullable = false)
    private User ptUser;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PtAssignmentStatus status = PtAssignmentStatus.ACTIVE;

    @Column(columnDefinition = "text")
    private String note;
}
