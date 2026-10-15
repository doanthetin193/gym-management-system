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

    @Query("select coalesce(sum(payment.amount), 0) from Payment payment where payment.paymentDate between :startDate and :endDate")
    BigDecimal sumAmountByPaymentDateBetween(
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    List<Payment> findByMemberIdOrderByPaymentDateDesc(Long memberId);
}
