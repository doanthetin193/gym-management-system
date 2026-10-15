package com.gymduongdouble.backend.pt.web.dto;

import com.gymduongdouble.backend.common.enums.PtLevel;
import com.gymduongdouble.backend.pt.domain.PtProfile;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.math.BigDecimal;

@JsonInclude(JsonInclude.Include.NON_NULL)
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
        return from(profile, true);
    }

    public static PtProfileResponse from(PtProfile profile, boolean includeFinancialDetails) {
        return new PtProfileResponse(
            profile.getId(),
            profile.getUser().getId(),
            profile.getUser().getFullName(),
            profile.getPtLevel(),
            profile.getSpecialty(),
            profile.getBio(),
            includeFinancialDetails ? profile.getBaseSalary() : null,
            includeFinancialDetails ? profile.getTeachingRate() : null,
            includeFinancialDetails ? profile.getSalesCommissionRate() : null,
            profile.isActive()
        );
    }
}
