package com.gymduongdouble.backend.exercise.repository;

import com.gymduongdouble.backend.exercise.domain.Exercise;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExerciseRepository extends JpaRepository<Exercise, Long> {
    Optional<Exercise> findBySlug(String slug);
}
