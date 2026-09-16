package com.gymduongdouble.backend.training.repository;

import com.gymduongdouble.backend.training.domain.TrainingProgram;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TrainingProgramRepository extends JpaRepository<TrainingProgram, Long> {
    List<TrainingProgram> findByMemberIdOrderByCreatedAtDesc(Long memberId);
}
