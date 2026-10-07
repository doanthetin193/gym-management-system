package com.gymduongdouble.backend.exercise.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ExerciseCategoryRequest(
    @NotBlank(message = "Tên danh mục không được để trống.")
    @Size(max = 150, message = "Tên danh mục tối đa 150 ký tự.")
    String name,

    @Size(max = 180, message = "Slug tối đa 180 ký tự.")
    String slug,

    String description,

    @Size(max = 80, message = "Tên icon tối đa 80 ký tự.")
    String iconName,

    Integer sortOrder,

    Boolean active
) {
}
