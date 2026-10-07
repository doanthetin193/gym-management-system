package com.gymduongdouble.backend.pt.web.dto;

import com.gymduongdouble.backend.common.enums.ActivityType;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public record MemberActivityLogRequest(
    Long membershipId,
    Long sessionPackageId,

    @NotNull(message = "Loại hoạt động là bắt buộc.")
    ActivityType activityType,

    @NotNull(message = "Ngày hoạt động là bắt buộc.")
    LocalDate activityDate,

    Integer sessionNumber,
    BigDecimal weight,
    String note
) {
}
