package com.gymduongdouble.backend.member.web.dto;

public record MemberListStatisticsResponse(
    long totalMembers,
    long activeMembers,
    long expiringSoonMembers,
    long expiredMembers
) {
}
