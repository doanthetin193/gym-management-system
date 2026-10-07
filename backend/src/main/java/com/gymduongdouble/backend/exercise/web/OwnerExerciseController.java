package com.gymduongdouble.backend.exercise.web;

import com.gymduongdouble.backend.common.enums.ExerciseDifficulty;
import com.gymduongdouble.backend.common.web.dto.ApiResponse;
import com.gymduongdouble.backend.common.web.dto.PageResponse;
import com.gymduongdouble.backend.exercise.service.ExerciseService;
import com.gymduongdouble.backend.exercise.web.dto.ExerciseCategoryRequest;
import com.gymduongdouble.backend.exercise.web.dto.ExerciseCategoryResponse;
import com.gymduongdouble.backend.exercise.web.dto.ExerciseRequest;
import com.gymduongdouble.backend.exercise.web.dto.ExerciseResponse;
import com.gymduongdouble.backend.exercise.web.dto.PublishExerciseRequest;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/owner")
@RequiredArgsConstructor
@PreAuthorize("hasRole('OWNER')")
public class OwnerExerciseController {

    private final ExerciseService exerciseService;

    @GetMapping("/exercise-categories")
    public ApiResponse<List<ExerciseCategoryResponse>> listCategories() {
        return ApiResponse.ok(exerciseService.listOwnerCategories());
    }

    @PostMapping("/exercise-categories")
    public ApiResponse<ExerciseCategoryResponse> createCategory(@Valid @RequestBody ExerciseCategoryRequest request) {
        return ApiResponse.created(exerciseService.createCategory(request));
    }

    @PutMapping("/exercise-categories/{id}")
    public ApiResponse<ExerciseCategoryResponse> updateCategory(
        @PathVariable Long id,
        @Valid @RequestBody ExerciseCategoryRequest request
    ) {
        return ApiResponse.ok(exerciseService.updateCategory(id, request));
    }

    @GetMapping("/exercises")
    public ApiResponse<PageResponse<ExerciseResponse>> listExercises(
        @RequestParam(required = false) String categorySlug,
        @RequestParam(required = false) ExerciseDifficulty level,
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) Boolean featured,
        @RequestParam(required = false) Boolean published,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "12") int size
    ) {
        return ApiResponse.ok(exerciseService.listOwnerExercises(categorySlug, level, keyword, featured, published, page, size));
    }

    @PostMapping("/exercises")
    public ApiResponse<ExerciseResponse> createExercise(@Valid @RequestBody ExerciseRequest request) {
        return ApiResponse.created(exerciseService.createExercise(request));
    }

    @PutMapping("/exercises/{id}")
    public ApiResponse<ExerciseResponse> updateExercise(@PathVariable Long id, @Valid @RequestBody ExerciseRequest request) {
        return ApiResponse.ok(exerciseService.updateExercise(id, request));
    }

    @PatchMapping("/exercises/{id}/published")
    public ApiResponse<ExerciseResponse> setPublished(
        @PathVariable Long id,
        @Valid @RequestBody PublishExerciseRequest request
    ) {
        return ApiResponse.ok(exerciseService.setPublished(id, request));
    }

    @DeleteMapping("/exercises/{id}")
    public ApiResponse<Void> deleteExercise(@PathVariable Long id) {
        exerciseService.deleteExercise(id);
        return ApiResponse.ok(null);
    }
}
