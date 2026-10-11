package com.gymduongdouble.backend.pt.web.dto;

import com.gymduongdouble.backend.common.enums.ActivityType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.LocalDate;

public record MemberActivityLogRequest(
    Long membershipId,
    Long sessionPackageId,

    @NotNull(message = "Loại hoạt động là bắt buộc.")
    ActivityType activityType,

    @NotNull(message = "Ngày hoạt động là bắt buộc.")
    LocalDate activityDate,

    @Positive(message = "Số thứ tự buổi phải lớn hơn 0.")
    Integer sessionNumber,

    @DecimalMin(value = "0.0", inclusive = false, message = "Cân nặng phải lớn hơn 0.")
    BigDecimal weight,

    String note
) {
}
