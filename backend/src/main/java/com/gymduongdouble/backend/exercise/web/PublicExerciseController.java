package com.gymduongdouble.backend.exercise.web;

import com.gymduongdouble.backend.common.enums.ExerciseDifficulty;
import com.gymduongdouble.backend.common.web.dto.ApiResponse;
import com.gymduongdouble.backend.common.web.dto.PageResponse;
import com.gymduongdouble.backend.exercise.service.ExerciseService;
import com.gymduongdouble.backend.exercise.web.dto.ExerciseCategoryResponse;
import com.gymduongdouble.backend.exercise.web.dto.ExerciseResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/public")
@RequiredArgsConstructor
public class PublicExerciseController {

    private final ExerciseService exerciseService;

    @GetMapping("/exercise-categories")
    public ApiResponse<List<ExerciseCategoryResponse>> listCategories() {
        return ApiResponse.ok(exerciseService.listPublicCategories());
    }

    @GetMapping("/exercises")
    public ApiResponse<PageResponse<ExerciseResponse>> listExercises(
        @RequestParam(required = false) String categorySlug,
        @RequestParam(required = false) ExerciseDifficulty level,
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) Boolean featured,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "12") int size
    ) {
        return ApiResponse.ok(exerciseService.listPublicExercises(categorySlug, level, keyword, featured, page, size));
    }

    @GetMapping("/exercises/{slugOrId}")
    public ApiResponse<ExerciseResponse> getExercise(@PathVariable String slugOrId) {
        return ApiResponse.ok(exerciseService.getPublicExercise(slugOrId));
    }

}
