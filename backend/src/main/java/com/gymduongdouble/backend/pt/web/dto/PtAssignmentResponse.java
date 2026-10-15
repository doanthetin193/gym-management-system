package com.gymduongdouble.backend.pt.web.dto;

import com.gymduongdouble.backend.common.enums.PtAssignmentStatus;
import com.gymduongdouble.backend.pt.domain.PtAssignment;
import java.time.LocalDate;

public record PtAssignmentResponse(
    Long id,
    Long ptUserId,
    String ptFullName,
    Long memberId,
    String memberName,
    String memberPhone,
    LocalDate startDate,
    LocalDate endDate,
    PtAssignmentStatus status,
    String note
) {

    public static PtAssignmentResponse from(PtAssignment assignment) {
        return from(assignment, assignment.getStatus());
    }

    public static PtAssignmentResponse from(PtAssignment assignment, PtAssignmentStatus status) {
        return new PtAssignmentResponse(
            assignment.getId(),
            assignment.getPtUser().getId(),
            assignment.getPtUser().getFullName(),
            assignment.getMember().getId(),
            assignment.getMember().getFullName(),
            assignment.getMember().getPhone(),
            assignment.getStartDate(),
            assignment.getEndDate(),
            status,
            assignment.getNote()
        );
    }
}
