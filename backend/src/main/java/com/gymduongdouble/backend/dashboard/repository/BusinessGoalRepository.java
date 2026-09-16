package com.gymduongdouble.backend.dashboard.repository;

import com.gymduongdouble.backend.dashboard.domain.BusinessGoal;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BusinessGoalRepository extends JpaRepository<BusinessGoal, Long> {
    List<BusinessGoal> findByYearAndMonth(Integer year, Integer month);
}
