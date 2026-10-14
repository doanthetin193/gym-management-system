package com.gymduongdouble.backend.member.web.dto;

public record CreatePortalAccountRequest(
    String password
) {
    @Override
    public String toString() {
        return "CreatePortalAccountRequest[password=***]";
    }
}
