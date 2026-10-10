package com.gymduongdouble.backend.pt.repository;

import com.gymduongdouble.backend.pt.domain.PtSchedule;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PtScheduleRepository extends JpaRepository<PtSchedule, Long> {
    List<PtSchedule> findByPtUserIdAndScheduleDateBetween(Long ptUserId, LocalDate startDate, LocalDate endDate);
    List<PtSchedule> findByScheduleDateBetween(LocalDate startDate, LocalDate endDate);
    List<PtSchedule> findByMemberIdAndScheduleDateBetween(Long memberId, LocalDate startDate, LocalDate endDate);
    List<PtSchedule> findByMemberIdOrderByScheduleDateDesc(Long memberId);
}
