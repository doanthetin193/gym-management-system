package com.gymduongdouble.backend.pt.repository;

import com.gymduongdouble.backend.common.enums.PtSessionStatus;
import com.gymduongdouble.backend.pt.domain.PtSessionLog;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PtSessionLogRepository extends JpaRepository<PtSessionLog, Long> {
    List<PtSessionLog> findByMemberIdOrderBySessionDateDesc(Long memberId);
    List<PtSessionLog> findByPtUserIdAndSessionDateBetween(Long ptUserId, LocalDate startDate, LocalDate endDate);
    boolean existsByScheduleId(Long scheduleId);
    boolean existsBySessionPackageIdAndSessionNumberAndStatusIn(Long sessionPackageId, Integer sessionNumber, Collection<PtSessionStatus> statuses);
    boolean existsBySessionPackageIdAndSessionDateAndStatusIn(Long sessionPackageId, LocalDate sessionDate, Collection<PtSessionStatus> statuses);
}
