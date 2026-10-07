package com.gymduongdouble.backend.finance.web.dto;

import com.gymduongdouble.backend.common.enums.DebtStatus;
import com.gymduongdouble.backend.finance.domain.DebtRecord;
import java.math.BigDecimal;
import java.time.LocalDate;

public record DebtRecordResponse(
    Long id,
    Long memberId,
    String memberName,
    String memberPhone,
    Long membershipId,
    String planName,
    BigDecimal originalAmount,
    BigDecimal paidAmount,
    BigDecimal remainingAmount,
    LocalDate dueDate,
    DebtStatus status,
    String note
) {

    public static DebtRecordResponse from(DebtRecord debtRecord) {
        return new DebtRecordResponse(
            debtRecord.getId(),
            debtRecord.getMember().getId(),
            debtRecord.getMember().getFullName(),
            debtRecord.getMember().getPhone(),
            debtRecord.getMembership() == null ? null : debtRecord.getMembership().getId(),
            debtRecord.getMembership() == null ? null : debtRecord.getMembership().getPlan().getName(),
            debtRecord.getOriginalAmount(),
            debtRecord.getPaidAmount(),
            debtRecord.getRemainingAmount(),
            debtRecord.getDueDate(),
            debtRecord.getStatus(),
            debtRecord.getNote()
        );
    }
}
