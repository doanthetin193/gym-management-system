package com.gymduongdouble.backend.finance.domain;

import com.gymduongdouble.backend.common.domain.AuditableEntity;
import com.gymduongdouble.backend.common.enums.DebtStatus;
import com.gymduongdouble.backend.member.domain.Member;
import com.gymduongdouble.backend.membership.domain.MemberMembership;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Entity đại diện cho khoản công nợ phải thu của hội viên (Accounts Receivable).
 * <p>
 * THIẾT KẾ KIẾN TRÚC & TÀI CHÍNH:
 * 1. Tách biệt Công nợ (DebtRecord) và Dòng tiền (Payment):
 *    - DebtRecord đại diện cho NGHĨA VỤ TÀI CHÍNH còn nợ của hội viên sau khi đăng ký gói tập.
 *    - DebtRecord CỐ TÌNH KHÔNG LƯU `paymentMethod`. Lý do: Một khoản công nợ có thể được tất toán
 *      thành nhiều đợt (installments) với nhiều phương thức thanh toán khác nhau (ví dụ: đợt 1 chuyển
 *      khoản ngân hàng qua VietQR, đợt 2 trả tiền mặt tại quầy). Phương thức thanh toán thuộc về
 *      từng giao dịch thực thu (Payment), không thuộc về bản ghi nợ.
 * 2. Ràng buộc với gói tập (MemberMembership):
 *    - Mỗi khoản nợ gắn với một lượt đăng ký gói cụ thể để đảm bảo minh bạch dòng tiền và đối soát.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "debt_records")
public class DebtRecord extends AuditableEntity {

    /**
     * KHÓA LẠC QUAN (Optimistic Locking):
     * Ngăn chặn lỗi Lost Update (mất mát dữ liệu khi ghi đè) trong kịch bản đồng thời (concurrency):
     * Ví dụ: 2 phiên thao tác cùng mở phiếu thu để gạch nợ cho một hội viên tại cùng một thời điểm.
     * Khi phiên A commit trước, version tăng lên 1. Khi phiên B commit sau với version cũ (0),
     * Hibernate sẽ phát hiện version không khớp và ném ra ObjectOptimisticLockingFailureException.
     * Ngoại lệ này được GlobalExceptionHandler bắt và chuyển thành HTTP 409 Conflict (CONCURRENT_UPDATE).
     */
    @Version
    @Column(nullable = false, columnDefinition = "bigint default 0")
    private Long version = 0L;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "membership_id")
    private MemberMembership membership;

    @Column(name = "original_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal originalAmount = BigDecimal.ZERO;

    @Column(name = "paid_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Column(name = "remaining_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal remainingAmount = BigDecimal.ZERO;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private DebtStatus status = DebtStatus.OPEN;

    @Column(columnDefinition = "text")
    private String note;
}
