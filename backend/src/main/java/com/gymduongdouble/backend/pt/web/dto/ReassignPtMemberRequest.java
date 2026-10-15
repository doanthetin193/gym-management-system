package com.gymduongdouble.backend.pt.web.dto;

import jakarta.validation.constraints.NotNull;

public record ReassignPtMemberRequest(
    @NotNull(message = "PT mới phụ trách là bắt buộc.")
    Long ptUserId,
    String note
) {
}
