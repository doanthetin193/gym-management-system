package com.gymduongdouble.backend.pt.web.dto;

import com.gymduongdouble.backend.common.enums.PtSessionStatus;
import com.gymduongdouble.backend.pt.domain.PtSessionLog;
import java.math.BigDecimal;
import java.time.LocalDate;

public record PtSessionLogResponse(
    Long id,
    Long sessionPackageId,
    Long memberId,
    String memberName,
    Long ptUserId,
    String ptFullName,
    Long scheduleId,
    LocalDate sessionDate,
    Integer sessionNumber,
    BigDecimal weight,
    PtSessionStatus status,
    String content,
    String note
) {

    public static PtSessionLogResponse from(PtSessionLog log) {
        return new PtSessionLogResponse(
            log.getId(),
            log.getSessionPackage().getId(),
            log.getMember().getId(),
            log.getMember().getFullName(),
            log.getPtUser() == null ? null : log.getPtUser().getId(),
            log.getPtUser() == null ? null : log.getPtUser().getFullName(),
            log.getSchedule() == null ? null : log.getSchedule().getId(),
            log.getSessionDate(),
            log.getSessionNumber(),
            log.getWeight(),
            log.getStatus(),
            log.getContent(),
            log.getNote()
        );
    }
}
