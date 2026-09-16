package com.gymduongdouble.backend.finance.repository;

import com.gymduongdouble.backend.finance.domain.FinancialCategory;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FinancialCategoryRepository extends JpaRepository<FinancialCategory, Long> {
    Optional<FinancialCategory> findByCode(String code);
}
