package com.gymduongdouble.backend.training.domain;

import com.gymduongdouble.backend.common.domain.AuditableEntity;
import com.gymduongdouble.backend.common.enums.GoalType;
import com.gymduongdouble.backend.common.enums.ProgramStatus;
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
 * Entity lưu trữ Mục tiêu luyện tập của hội viên cùng Huấn luyện viên (Training Goal).
 * <p>
 * NGUYÊN TẮC QUẢN TRỊ MỤC TIÊU:
 * 1. Dữ liệu kỳ vọng (Target / Expected Data): Lưu trữ các đích đến thể chất (targetWeight, targetBodyFat, targetWaist).
 * 2. Độc lập với số đo: Lưu mục tiêu không tự sinh ra số đo thực tế.
 * 3. Không tự động hoàn thành: Hệ thống cố tình không tự động chuyển trạng thái sang COMPLETED khi
 *    cân nặng chạm ngưỡng, mà để HLV và hội viên cùng đánh giá toàn diện vóc dáng thực tế.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "pt_goals")
public class PtGoal extends AuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pt_user_id")
    private User ptUser;

    @Enumerated(EnumType.STRING)
    @Column(name = "goal_type", nullable = false, length = 30)
    private GoalType goalType = GoalType.OTHER;

    @Column(name = "goal_description", columnDefinition = "text")
    private String goalDescription;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "target_date")
    private LocalDate targetDate;

    @Column(name = "target_weight", precision = 8, scale = 2)
    private BigDecimal targetWeight;

    @Column(name = "target_body_fat", precision = 8, scale = 2)
    private BigDecimal targetBodyFat;

    @Column(name = "target_waist", precision = 8, scale = 2)
    private BigDecimal targetWaist;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ProgramStatus status = ProgramStatus.ACTIVE;

    @Column(columnDefinition = "text")
    private String note;
}
