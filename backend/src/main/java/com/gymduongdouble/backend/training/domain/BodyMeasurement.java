package com.gymduongdouble.backend.training.domain;

import com.gymduongdouble.backend.common.domain.BaseEntity;
import com.gymduongdouble.backend.member.domain.Member;
import com.gymduongdouble.backend.user.domain.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

/**
 * Entity lưu trữ số đo chỉ số cơ thể thực tế của hội viên (Body Measurement / InBody Tracking).
 * <p>
 * ĐẶC ĐIỂM DỮ LIỆU & KIẾN TRÚC:
 * 1. Dữ liệu quan sát thực tế (Observed Data): Ghi nhận kết quả đo thực tế (cân nặng, chiều cao, vòng eo, ngực...).
 * 2. Lưu trữ nối tiếp (Append-only History): Mỗi lần đo là một bản ghi mới có timestamp `recordedAt`.
 *    Không ghi đè bản ghi cũ để hệ thống có thể vẽ biểu đồ tiến trình biến thiên vóc dáng theo thời gian.
 * 3. "Chỉ số hiện tại" trên giao diện là bản ghi gần nhất (latest recordedAt), không phải một cột tĩnh trong bảng members.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "body_measurements")
@EntityListeners(AuditingEntityListener.class)
public class BodyMeasurement extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recorded_by")
    private User recordedBy;

    @Column(name = "recorded_at", nullable = false)
    private Instant recordedAt;

    @Column(precision = 8, scale = 2)
    private BigDecimal height;

    @Column(precision = 8, scale = 2)
    private BigDecimal weight;

    @Column(precision = 8, scale = 2)
    private BigDecimal chest;

    @Column(precision = 8, scale = 2)
    private BigDecimal waist;

    @Column(precision = 8, scale = 2)
    private BigDecimal abdomen;

    @Column(precision = 8, scale = 2)
    private BigDecimal hip;

    @Column(precision = 8, scale = 2)
    private BigDecimal thigh;

    @Column(precision = 8, scale = 2)
    private BigDecimal arm;

    @Column(columnDefinition = "text")
    private String note;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
