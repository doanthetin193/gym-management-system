package com.gymduongdouble.backend.pt.web.dto;

import com.gymduongdouble.backend.common.enums.SessionPackageStatus;
import com.gymduongdouble.backend.pt.domain.PtSessionPackage;
import java.time.LocalDate;

public record PtSessionPackageSummaryResponse(
    Long id,
    Long memberId,
    String memberName,
    Long ptUserId,
    String ptFullName,
    Long membershipId,
    String planName,
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

    public static PtSessionPackageSummaryResponse from(PtSessionPackage sessionPackage) {
        return new PtSessionPackageSummaryResponse(
            sessionPackage.getId(),
            sessionPackage.getMember().getId(),
            sessionPackage.getMember().getFullName(),
            sessionPackage.getPtUser() == null ? null : sessionPackage.getPtUser().getId(),
            sessionPackage.getPtUser() == null ? null : sessionPackage.getPtUser().getFullName(),
            sessionPackage.getMembership().getId(),
            sessionPackage.getMembership().getPlan().getName(),
            sessionPackage.getTotalPtSessions(),
            sessionPackage.getUsedPtSessions(),
            sessionPackage.getRemainingPtSessions(),
            sessionPackage.getTotalPracticeSessions(),
            sessionPackage.getUsedPracticeSessions(),
            sessionPackage.getRemainingPracticeSessions(),
            sessionPackage.getStartDate(),
            sessionPackage.getEndDate(),
            sessionPackage.getStatus()
        );
    }
}
