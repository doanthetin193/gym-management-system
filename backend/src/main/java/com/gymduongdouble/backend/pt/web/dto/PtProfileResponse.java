package com.gymduongdouble.backend.pt.web.dto;

import com.gymduongdouble.backend.common.enums.PtLevel;
import com.gymduongdouble.backend.pt.domain.PtProfile;
import java.math.BigDecimal;

public record PtProfileResponse(
    Long id,
    Long userId,
    String fullName,
    PtLevel ptLevel,
    String specialty,
    String bio,
    BigDecimal baseSalary,
    BigDecimal teachingRate,
    BigDecimal salesCommissionRate,
    boolean active
) {

    public static PtProfileResponse from(PtProfile profile) {
        return new PtProfileResponse(
            profile.getId(),
            profile.getUser().getId(),
            profile.getUser().getFullName(),
            profile.getPtLevel(),
            profile.getSpecialty(),
            profile.getBio(),
            profile.getBaseSalary(),
            profile.getTeachingRate(),
            profile.getSalesCommissionRate(),
            profile.isActive()
        );
    }
}
