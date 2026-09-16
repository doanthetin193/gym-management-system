package com.gymduongdouble.backend.training.repository;

import com.gymduongdouble.backend.training.domain.BodyMeasurement;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BodyMeasurementRepository extends JpaRepository<BodyMeasurement, Long> {
    List<BodyMeasurement> findByMemberIdOrderByRecordedAtDesc(Long memberId);
}
