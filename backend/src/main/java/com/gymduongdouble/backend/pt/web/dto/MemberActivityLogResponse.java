package com.gymduongdouble.backend.pt.web.dto;

import com.gymduongdouble.backend.common.enums.ActivityType;
import com.gymduongdouble.backend.pt.domain.MemberActivityLog;
import java.math.BigDecimal;
import java.time.LocalDate;

public record MemberActivityLogResponse(
    Long id,
    Long memberId,
    String memberName,
    Long membershipId,
    Long sessionPackageId,
    ActivityType activityType,
    LocalDate activityDate,
    Integer sessionNumber,
    BigDecimal weight,
    String note
) {

    public static MemberActivityLogResponse from(MemberActivityLog log) {
        return new MemberActivityLogResponse(
            log.getId(),
            log.getMember().getId(),
            log.getMember().getFullName(),
            log.getMembership() == null ? null : log.getMembership().getId(),
            log.getSessionPackage() == null ? null : log.getSessionPackage().getId(),
            log.getActivityType(),
            log.getActivityDate(),
            log.getSessionNumber(),
            log.getWeight(),
            log.getNote()
        );
    }
}
