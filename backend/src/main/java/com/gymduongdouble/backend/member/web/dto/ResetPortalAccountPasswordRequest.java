package com.gymduongdouble.backend.member.web.dto;

public record ResetPortalAccountPasswordRequest(
    String newPassword
) {
    @Override
    public String toString() {
        return "ResetPortalAccountPasswordRequest[newPassword=***]";
    }
}
