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

/**
 * Controller công khai tra cứu Thư viện bài tập và danh mục (Không yêu cầu đăng nhập).
 * 
 * QUY TẮC HIỂN THỊ:
 * - Chỉ trả về bài tập có `active = true` VÀ danh mục tương ứng có `active = true`.
 * - Hỗ trợ tra cứu chi tiết linh hoạt theo ID số hoặc SEO slug (`/exercises/{slugOrId}`).
 */
@RestController
@RequestMapping("/v1/public")
@RequiredArgsConstructor
public class PublicExerciseController {

    private final ExerciseService exerciseService;

    @GetMapping("/exercise-categories")
    public ApiResponse<List<ExerciseCategoryResponse>> listCategories() {
        return ApiResponse.ok(exerciseService.listPublicCategories());
    }

    /**
     * API công khai phân trang danh sách bài tập (Database Pagination):
     * - Mặc định size = 12 (phù hợp với lưới giao diện 3 cột x 4 hàng hoặc 4 cột x 3 hàng).
     * - page: Zero-based index (0 là trang đầu).
     */
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
