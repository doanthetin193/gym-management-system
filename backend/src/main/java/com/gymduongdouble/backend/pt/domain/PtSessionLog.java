package com.gymduongdouble.backend.pt.domain;

import com.gymduongdouble.backend.common.domain.AuditableEntity;
import com.gymduongdouble.backend.common.enums.PtSessionStatus;
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
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Entity đại diện cho Nhật ký buổi tập PT 1:1 thực tế (Execution Evidence / Check-in Log).
 * <p>
 * NGUYÊN TẮC QUẢN TRỊ KẾT QUẢ BUỔI TẬP:
 * 1. Bằng chứng thực thi: Chỉ khi bản ghi này được tạo thành công vào DB thì buổi tập mới được
 *    công nhận là đã diễn ra và mới tiêu hao định mức trong PtSessionPackage (remainingPtSessions - 1).
 * 2. Phân loại trạng thái tiêu hao:
 *    - `COMPLETED`: Học viên hoàn thành buổi tập -> Trừ buổi.
 *    - `MISSED`: Học viên vắng mặt không báo trước (bùng kèo) -> Vẫn trừ buổi theo chính sách phòng gym.
 *    - `CANCELLED`, `RESCHEDULED`: Không trừ buổi.
 * 3. Đồng bộ hai chiều với Lịch hẹn (PtSchedule):
 *    - Nếu buổi tập gắn với một lịch hẹn (schedule != null), trạng thái của lịch sẽ được đồng bộ
 *      tương ứng với trạng thái của nhật ký này.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "pt_session_logs")
public class PtSessionLog extends AuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_package_id", nullable = false)
    private PtSessionPackage sessionPackage;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pt_user_id")
    private User ptUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_id")
    private PtSchedule schedule;

    @Column(name = "session_date", nullable = false)
    private LocalDate sessionDate;

    @Column(name = "session_number")
    private Integer sessionNumber;

    @Column(precision = 8, scale = 2)
    private BigDecimal weight;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PtSessionStatus status = PtSessionStatus.COMPLETED;

    @Column(columnDefinition = "text")
    private String content;

    @Column(columnDefinition = "text")
    private String note;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;
}
