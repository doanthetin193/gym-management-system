package com.gymduongdouble.backend.exercise.web.dto;

import jakarta.validation.constraints.NotNull;

public record PublishExerciseRequest(
    @NotNull(message = "Trạng thái hiển thị không được để trống.")
    Boolean published
) {
}
