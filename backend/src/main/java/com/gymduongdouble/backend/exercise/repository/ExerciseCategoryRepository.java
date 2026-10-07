package com.gymduongdouble.backend.exercise.repository;

import com.gymduongdouble.backend.exercise.domain.ExerciseCategory;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExerciseCategoryRepository extends JpaRepository<ExerciseCategory, Long> {
    Optional<ExerciseCategory> findBySlug(String slug);

    boolean existsBySlug(String slug);

    List<ExerciseCategory> findByActiveTrueOrderBySortOrderAscNameAsc();

    List<ExerciseCategory> findAllByOrderBySortOrderAscNameAsc();
}
