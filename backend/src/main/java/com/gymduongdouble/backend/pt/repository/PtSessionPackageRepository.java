package com.gymduongdouble.backend.pt.repository;

import com.gymduongdouble.backend.pt.domain.PtSessionPackage;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PtSessionPackageRepository extends JpaRepository<PtSessionPackage, Long> {
    List<PtSessionPackage> findByMemberIdOrderByStartDateDesc(Long memberId);
    List<PtSessionPackage> findByStatusAndRemainingPtSessionsLessThanEqualOrderByRemainingPtSessionsAsc(
        com.gymduongdouble.backend.common.enums.SessionPackageStatus status,
        Integer remainingPtSessions
    );
}
