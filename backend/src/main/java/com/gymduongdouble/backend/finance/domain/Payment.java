package com.gymduongdouble.backend.finance.domain;

import com.gymduongdouble.backend.common.domain.BaseEntity;
import com.gymduongdouble.backend.common.enums.PaymentMethod;
import com.gymduongdouble.backend.common.enums.RevenueCategory;
import com.gymduongdouble.backend.member.domain.Member;
import com.gymduongdouble.backend.membership.domain.MemberMembership;
import com.gymduongdouble.backend.user.domain.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

/**
 * Entity đại diện cho phiếu thu / giao dịch thực thu dòng tiền vào phòng gym (Payment Transaction).
 * <p>
 * NGUYÊN TẮC QUẢN TRỊ DÒNG TIỀN (CASH-BASIS ACCOUNTING):
 * 1. Doanh thu chỉ được ghi nhận khi phiếu thu (Payment) được tạo thành công vào DB,
 *    tuyệt đối không ghi nhận doanh thu tại thời điểm đăng ký gói tập hay phát sinh công nợ.
 * 2. Tách biệt rõ ràng 3 mốc thời gian:
 *    - `paymentDate`: Ngày kế toán ghi nhận giao dịch thu tiền (dùng cho thống kê doanh thu, báo cáo ngày/tháng).
 *    - `createdAt`: Dấu vết kiểm toán thực tế (Audit Timestamp) do hệ thống tự sinh khi insert bản ghi.
 *    - `startDate`/`endDate` (từ MemberMembership): Thời hạn sử dụng dịch vụ của hội viên.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "payment_transactions")
@EntityListeners(AuditingEntityListener.class)
public class Payment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "membership_id")
    private MemberMembership membership;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "debt_record_id")
    private DebtRecord debtRecord;

    @Column(name = "payment_date", nullable = false)
    private LocalDate paymentDate;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 30)
    private PaymentMethod paymentMethod = PaymentMethod.CASH;

    @Enumerated(EnumType.STRING)
    @Column(name = "revenue_category", nullable = false, length = 40)
    private RevenueCategory revenueCategory;

    @Column(columnDefinition = "text")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
