package com.gymduongdouble.backend.pt.web.dto;

import com.gymduongdouble.backend.training.domain.BodyMeasurement;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;

public record BodyMeasurementResponse(
    Long id,
    Long memberId,
    String memberName,
    Long recordedById,
    String recordedByName,
    LocalDate recordedAt,
    BigDecimal height,
    BigDecimal weight,
    BigDecimal chest,
    BigDecimal waist,
    BigDecimal abdomen,
    BigDecimal hip,
    BigDecimal thigh,
    BigDecimal arm,
    String note
) {

    private static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    public static BodyMeasurementResponse from(BodyMeasurement measurement) {
        return new BodyMeasurementResponse(
            measurement.getId(),
            measurement.getMember().getId(),
            measurement.getMember().getFullName(),
            measurement.getRecordedBy() == null ? null : measurement.getRecordedBy().getId(),
            measurement.getRecordedBy() == null ? null : measurement.getRecordedBy().getFullName(),
            measurement.getRecordedAt().atZone(VIETNAM_ZONE).toLocalDate(),
            measurement.getHeight(),
            measurement.getWeight(),
            measurement.getChest(),
            measurement.getWaist(),
            measurement.getAbdomen(),
            measurement.getHip(),
            measurement.getThigh(),
            measurement.getArm(),
            measurement.getNote()
        );
    }
}
