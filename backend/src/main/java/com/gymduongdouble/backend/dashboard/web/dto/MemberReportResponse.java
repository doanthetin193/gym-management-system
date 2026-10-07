package com.gymduongdouble.backend.dashboard.web.dto;

public record MemberReportResponse(
    Integer year,
    Integer month,
    long newMembers,
    long renewedMembers,
    long selfTrainingCustomers,
    long guidedCustomers,
    long newPtCustomers,
    long mainPtCustomers,
    long expiringSoon,
    long expired
) {
}
