package com.gymduongdouble.backend.finance.repository;

import com.gymduongdouble.backend.finance.domain.Payment;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByPaymentDateBetween(LocalDate startDate, LocalDate endDate);

    /**
     * Tính tổng doanh thu thực thu trong khoảng thời gian xác định (Dùng cho Dashboard và Báo cáo tài chính).
     * <p>
     * THIẾT KẾ TRUY VẤN JPQL & NGUYÊN TẮC KẾ TOÁN:
     * 1. Lọc theo `paymentDate`:
     *    - Doanh thu kế toán ghi nhận theo DÒNG TIỀN THỰC THU (Cash Inflow).
     *    - Tuyệt đối không dùng `createdAt` (thời điểm insert bản ghi SQL) vì khi nhân viên nhập bù sổ sách
     *      lịch sử, `createdAt` sẽ ở hiện tại nhưng `paymentDate` thuộc về quá khứ.
     * 2. Sử dụng hàm `coalesce(sum(payment.amount), 0)`:
     *    - Trong chuẩn SQL/JPQL, nếu không có bản ghi nào thỏa mãn điều kiện `WHERE`, hàm `SUM()` sẽ trả về `NULL`.
     *    - Nếu không có `coalesce`, Spring Data JPA sẽ trả về `null`, dẫn đến lỗi `NullPointerException`
     *      khi thực hiện các phép tính số học trên BigDecimal trong DashboardService.
     *    - `coalesce(..., 0)` ép giá trị về 0 nếu kết quả là null, đảm bảo an toàn tuyệt đối.
     */
    @Query("select coalesce(sum(payment.amount), 0) from Payment payment where payment.paymentDate between :startDate and :endDate")
    BigDecimal sumAmountByPaymentDateBetween(
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    List<Payment> findByMemberIdOrderByPaymentDateDesc(Long memberId);
}
