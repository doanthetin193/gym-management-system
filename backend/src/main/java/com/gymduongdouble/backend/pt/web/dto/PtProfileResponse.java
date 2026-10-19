package com.gymduongdouble.backend.pt.web.dto;

import com.gymduongdouble.backend.common.enums.PtLevel;
import com.gymduongdouble.backend.pt.domain.PtProfile;
public record PtProfileResponse(
    Long id,
    Long userId,
    String fullName,
    PtLevel ptLevel,
    String specialty,
    String bio,
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
            profile.isActive()
        );
    }
}
