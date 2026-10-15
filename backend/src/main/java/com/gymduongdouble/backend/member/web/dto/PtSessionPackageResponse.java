package com.gymduongdouble.backend.member.web.dto;

import com.gymduongdouble.backend.common.enums.SessionPackageStatus;
import com.gymduongdouble.backend.pt.domain.PtSessionPackage;
import java.time.LocalDate;

public record PtSessionPackageResponse(
    Long id,
    Long membershipId,
    Long ptUserId,
    String ptFullName,
    Integer totalPtSessions,
    Integer usedPtSessions,
    Integer remainingPtSessions,
    Integer totalPracticeSessions,
    Integer usedPracticeSessions,
    Integer remainingPracticeSessions,
    LocalDate startDate,
    LocalDate endDate,
    SessionPackageStatus status
) {

    public static PtSessionPackageResponse from(PtSessionPackage sessionPackage) {
        return from(sessionPackage, sessionPackage.getStatus());
    }

    public static PtSessionPackageResponse from(PtSessionPackage sessionPackage, SessionPackageStatus status) {
        return new PtSessionPackageResponse(
            sessionPackage.getId(),
            sessionPackage.getMembership().getId(),
            sessionPackage.getPtUser() == null ? null : sessionPackage.getPtUser().getId(),
            sessionPackage.getPtUser() == null ? null : sessionPackage.getPtUser().getFullName(),
            sessionPackage.getTotalPtSessions(),
            sessionPackage.getUsedPtSessions(),
            sessionPackage.getRemainingPtSessions(),
            sessionPackage.getTotalPracticeSessions(),
            sessionPackage.getUsedPracticeSessions(),
            sessionPackage.getRemainingPracticeSessions(),
            sessionPackage.getStartDate(),
            sessionPackage.getEndDate(),
            status
        );
    }
}
