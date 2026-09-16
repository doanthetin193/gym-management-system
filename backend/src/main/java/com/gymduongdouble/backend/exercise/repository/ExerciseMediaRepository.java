package com.gymduongdouble.backend.exercise.repository;

import com.gymduongdouble.backend.exercise.domain.ExerciseMedia;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExerciseMediaRepository extends JpaRepository<ExerciseMedia, Long> {
    List<ExerciseMedia> findByExerciseIdOrderBySortOrderAsc(Long exerciseId);
}
