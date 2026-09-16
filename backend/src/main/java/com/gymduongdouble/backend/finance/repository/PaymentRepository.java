package com.gymduongdouble.backend.finance.repository;

import com.gymduongdouble.backend.finance.domain.Payment;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByPaymentDateBetween(LocalDate startDate, LocalDate endDate);
    List<Payment> findByMemberIdOrderByPaymentDateDesc(Long memberId);
}
