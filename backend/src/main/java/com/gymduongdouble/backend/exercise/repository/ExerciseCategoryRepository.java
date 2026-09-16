package com.gymduongdouble.backend.exercise.repository;

import com.gymduongdouble.backend.exercise.domain.ExerciseCategory;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExerciseCategoryRepository extends JpaRepository<ExerciseCategory, Long> {
    Optional<ExerciseCategory> findBySlug(String slug);
}
