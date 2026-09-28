package com.gymduongdouble.backend.member.web.dto;

import com.gymduongdouble.backend.common.enums.Gender;
import com.gymduongdouble.backend.common.enums.MemberSource;
import com.gymduongdouble.backend.common.enums.MemberStatus;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;

public record MemberUpdateRequest(
    @NotBlank(message = "Tên khách hàng là bắt buộc.")
    String fullName,

    @NotBlank(message = "Số điện thoại là bắt buộc.")
    String phone,

    LocalDate dateOfBirth,
    Gender gender,
    String address,
    String zaloPhone,
    MemberSource source,
    MemberStatus status,
    String note
) {
}
