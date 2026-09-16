package com.gymduongdouble.backend.training.repository;

import com.gymduongdouble.backend.training.domain.TrainingProgramWeek;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TrainingProgramWeekRepository extends JpaRepository<TrainingProgramWeek, Long> {
    List<TrainingProgramWeek> findByProgramIdOrderByWeekNumberAsc(Long programId);
}
