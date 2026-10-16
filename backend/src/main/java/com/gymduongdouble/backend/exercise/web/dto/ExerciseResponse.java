package com.gymduongdouble.backend.exercise.web.dto;

import com.gymduongdouble.backend.common.enums.ExerciseDifficulty;
import com.gymduongdouble.backend.exercise.domain.Exercise;

public record ExerciseResponse(
    Long id,
    Long categoryId,
    String categoryName,
    String categorySlug,
    String title,
    String slug,
    String description,
    String instruction,
    String commonMistakes,
    ExerciseDifficulty level,
    String muscleGroup,
    String equipment,
    String tiktokUrl,
    String tiktokVideoId,
    String thumbnailUrl,
    boolean featured,
    boolean published
) {

    public static ExerciseResponse from(Exercise exercise) {
        return new ExerciseResponse(
            exercise.getId(),
            exercise.getCategory() == null ? null : exercise.getCategory().getId(),
            exercise.getCategory() == null ? null : exercise.getCategory().getName(),
            exercise.getCategory() == null ? null : exercise.getCategory().getSlug(),
            exercise.getName(),
            exercise.getSlug(),
            exercise.getDescription(),
            exercise.getInstruction(),
            exercise.getCommonMistakes(),
            exercise.getDifficulty(),
            exercise.getPrimaryMuscle(),
            exercise.getEquipment(),
            exercise.getTiktokUrl(),
            exercise.getTiktokVideoId(),
            exercise.getThumbnailUrl(),
            exercise.isFeatured(),
            exercise.isActive()
        );
    }
}
