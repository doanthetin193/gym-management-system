package com.gymduongdouble.backend.finance.repository;

import com.gymduongdouble.backend.finance.domain.FinancialTransaction;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FinancialTransactionRepository extends JpaRepository<FinancialTransaction, Long> {
    List<FinancialTransaction> findByTransactionDateBetween(LocalDate startDate, LocalDate endDate);
}
