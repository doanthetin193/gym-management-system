package com.gymduongdouble.backend.pt.web.dto;

import com.gymduongdouble.backend.common.enums.ScheduleStatus;
import com.gymduongdouble.backend.pt.domain.PtSchedule;
import java.time.LocalDate;
import java.time.LocalTime;

public record PtScheduleResponse(
    Long id,
    Long ptUserId,
    String ptFullName,
    Long memberId,
    String memberName,
    LocalDate scheduleDate,
    LocalTime startTime,
    LocalTime endTime,
    ScheduleStatus status,
    String note
) {

    public static PtScheduleResponse from(PtSchedule schedule) {
        return new PtScheduleResponse(
            schedule.getId(),
            schedule.getPtUser().getId(),
            schedule.getPtUser().getFullName(),
            schedule.getMember() == null ? null : schedule.getMember().getId(),
            schedule.getMember() == null ? null : schedule.getMember().getFullName(),
            schedule.getScheduleDate(),
            schedule.getStartTime(),
            schedule.getEndTime(),
            schedule.getStatus(),
            schedule.getNote()
        );
    }
}
