package com.gymduongdouble.backend.member.web.dto;

import com.gymduongdouble.backend.common.enums.Gender;
import com.gymduongdouble.backend.common.enums.MemberSource;
import com.gymduongdouble.backend.common.enums.MemberStatus;
import com.gymduongdouble.backend.member.domain.Member;
import java.time.LocalDate;

public record MemberResponse(
    Long id,
    String fullName,
    String phone,
    LocalDate dateOfBirth,
    Gender gender,
    String address,
    String zaloPhone,
    MemberSource source,
    MemberStatus status,
    String note
) {

    public static MemberResponse from(Member member) {
        return new MemberResponse(
            member.getId(),
            member.getFullName(),
            member.getPhone(),
            member.getDateOfBirth(),
            member.getGender(),
            member.getAddress(),
            member.getZaloPhone(),
            member.getSource(),
            member.getStatus(),
            member.getNote()
        );
    }
}
