package com.gymduongdouble.backend.exercise.repository;

import com.gymduongdouble.backend.exercise.domain.Exercise;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ExerciseRepository extends JpaRepository<Exercise, Long>, JpaSpecificationExecutor<Exercise> {
    Optional<Exercise> findBySlug(String slug);

    Optional<Exercise> findBySlugAndActiveTrue(String slug);

    Optional<Exercise> findByIdAndActiveTrue(Long id);

    boolean existsBySlug(String slug);
}
