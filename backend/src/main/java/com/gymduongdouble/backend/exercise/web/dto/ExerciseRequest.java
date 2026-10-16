package com.gymduongdouble.backend.exercise.web.dto;

import com.gymduongdouble.backend.common.enums.ExerciseDifficulty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ExerciseRequest(
    @NotNull(message = "Danh mục bài tập không được để trống.")
    Long categoryId,

    @NotBlank(message = "Tên bài tập/video không được để trống.")
    @Size(max = 150, message = "Tên bài tập/video tối đa 150 ký tự.")
    String title,

    @Size(max = 180, message = "Slug tối đa 180 ký tự.")
    String slug,

    String description,
    String instruction,
    String commonMistakes,

    ExerciseDifficulty level,

    @Size(max = 120, message = "Nhóm cơ tối đa 120 ký tự.")
    String muscleGroup,

    @Size(max = 120, message = "Thiết bị tối đa 120 ký tự.")
    String equipment,

    @NotBlank(message = "Link TikTok không được để trống.")
    String tiktokUrl,

    String thumbnailUrl,
    Boolean featured,
    Boolean published
) {
}
