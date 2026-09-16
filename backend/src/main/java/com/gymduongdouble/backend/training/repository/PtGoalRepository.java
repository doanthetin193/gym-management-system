package com.gymduongdouble.backend.training.repository;

import com.gymduongdouble.backend.training.domain.PtGoal;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PtGoalRepository extends JpaRepository<PtGoal, Long> {
    List<PtGoal> findByMemberIdOrderByCreatedAtDesc(Long memberId);
}
