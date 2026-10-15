package com.gymduongdouble.backend.pt.repository;

import com.gymduongdouble.backend.common.enums.ActivityType;
import com.gymduongdouble.backend.pt.domain.MemberActivityLog;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MemberActivityLogRepository extends JpaRepository<MemberActivityLog, Long> {
    List<MemberActivityLog> findByMemberIdOrderByActivityDateDesc(Long memberId);
    long countByMembershipIdAndActivityType(Long membershipId, ActivityType activityType);
    boolean existsBySessionPackageIdAndActivityDateAndActivityType(Long sessionPackageId, LocalDate activityDate, ActivityType activityType);
    boolean existsByMembershipIdAndActivityDateAndActivityType(Long membershipId, LocalDate activityDate, ActivityType activityType);
}
