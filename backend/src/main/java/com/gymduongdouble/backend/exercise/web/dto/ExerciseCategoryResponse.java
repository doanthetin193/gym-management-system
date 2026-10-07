package com.gymduongdouble.backend.exercise.web.dto;

import com.gymduongdouble.backend.exercise.domain.ExerciseCategory;

public record ExerciseCategoryResponse(
    Long id,
    String name,
    String slug,
    String description,
    String iconName,
    Integer sortOrder,
    boolean active
) {

    public static ExerciseCategoryResponse from(ExerciseCategory category) {
        return new ExerciseCategoryResponse(
            category.getId(),
            category.getName(),
            category.getSlug(),
            category.getDescription(),
            category.getIconName(),
            category.getSortOrder(),
            category.isActive()
        );
    }
}
