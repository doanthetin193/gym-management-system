package com.gymduongdouble.backend.membership.web.dto;

import com.gymduongdouble.backend.common.enums.ContentAccessLevel;
import com.gymduongdouble.backend.common.enums.PlanType;
import com.gymduongdouble.backend.common.enums.PtLevel;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record MembershipPlanRequest(
    @NotBlank(message = "Tên gói là bắt buộc.")
    String name,

    @NotNull(message = "Loại gói là bắt buộc.")
    PlanType planType,

    PtLevel ptLevel,

    @Min(value = 1, message = "Thời hạn phải lớn hơn 0 ngày.")
    Integer durationDays,

    @DecimalMin(value = "0.0", message = "Giá gói không được âm.")
    BigDecimal defaultPrice,

    @Min(value = 0, message = "Số buổi PT không được âm.")
    Integer ptSessionCount,

    @Min(value = 0, message = "Số buổi ôn tập không được âm.")
    Integer practiceSessionCount,

    @Min(value = 0, message = "Số buổi giáo án không được âm.")
    Integer guidanceSessionCount,

    ContentAccessLevel contentAccessLevel,

    @DecimalMin(value = "0.0", message = "Tỉ lệ giá không được âm.")
    BigDecimal priceRatio,

    String description,
    Boolean active
) {
}
