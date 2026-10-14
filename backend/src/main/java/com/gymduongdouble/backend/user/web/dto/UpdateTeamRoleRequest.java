package com.gymduongdouble.backend.user.web.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateTeamRoleRequest(
    @NotBlank(message = "Vai trò không được để trống")
    String roleCode
) {
}
