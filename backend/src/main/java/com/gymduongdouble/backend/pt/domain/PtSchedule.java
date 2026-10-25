package com.gymduongdouble.backend.pt.domain;

import com.gymduongdouble.backend.common.domain.AuditableEntity;
import com.gymduongdouble.backend.common.enums.ScheduleStatus;
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
import java.time.LocalTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Entity đại diện cho Lịch hẹn tập luyện giữa Huấn luyện viên và Hội viên (PT Schedule / Slot Booking).
 * <p>
 * NGUYÊN TẮC THIẾT KẾ KẾ HOẠCH & TRẠNG THÁI:
 * 1. Kế hoạch thời gian (Plan / Slot booking):
 *    - Xác định khung giờ tập cụ thể (scheduleDate, startTime, endTime).
 *    - Đặt lịch KHÔNG trừ buổi tập của học viên. Nếu buổi tập bị hủy (CANCELLED) hoặc dời lịch (RESCHEDULED),
 *      số buổi tập trong PtSessionPackage hoàn toàn không bị ảnh hưởng, tránh phải hoàn trả phức tạp.
 * 2. Linh hoạt:
 *    - Có thể gắn với một hội viên cụ thể (member != null) hoặc là lịch cá nhân/bận của PT (member == null).
 * 3. Kiểm soát xung đột:
 *    - Hệ thống áp dụng thuật toán `overlaps()` để kiểm tra không trùng lịch cả 2 phía: PT và học viên.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "pt_schedules")
public class PtSchedule extends AuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pt_user_id", nullable = false)
    private User ptUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id")
    private Member member;

    @Column(name = "schedule_date", nullable = false)
    private LocalDate scheduleDate;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time")
    private LocalTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ScheduleStatus status = ScheduleStatus.SCHEDULED;

    @Column(columnDefinition = "text")
    private String note;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;
}
