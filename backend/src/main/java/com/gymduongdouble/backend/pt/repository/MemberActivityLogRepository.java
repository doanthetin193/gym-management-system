package com.gymduongdouble.backend.pt.repository;

import com.gymduongdouble.backend.common.enums.ActivityType;
import com.gymduongdouble.backend.pt.domain.MemberActivityLog;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MemberActivityLogRepository extends JpaRepository<MemberActivityLog, Long> {
    List<MemberActivityLog> findByMemberIdOrderByActivityDateDesc(Long memberId);
    long countByMembershipId(Long membershipId);
    long countByMembershipIdAndActivityType(Long membershipId, ActivityType activityType);
}
