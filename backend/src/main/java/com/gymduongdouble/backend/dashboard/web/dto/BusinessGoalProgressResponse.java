package com.gymduongdouble.backend.dashboard.web.dto;

import java.util.List;

public record BusinessGoalProgressResponse(
    Integer year,
    Integer month,
    List<BusinessGoalProgressItemResponse> items
) {
}
