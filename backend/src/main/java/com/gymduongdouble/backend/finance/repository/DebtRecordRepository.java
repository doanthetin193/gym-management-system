package com.gymduongdouble.backend.finance.repository;

import com.gymduongdouble.backend.finance.domain.DebtRecord;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DebtRecordRepository extends JpaRepository<DebtRecord, Long> {
    List<DebtRecord> findByMemberIdOrderByCreatedAtDesc(Long memberId);
    List<DebtRecord> findByMembershipIdOrderByCreatedAtDesc(Long membershipId);
    List<DebtRecord> findByStatusInOrderByDueDateAsc(List<com.gymduongdouble.backend.common.enums.DebtStatus> statuses);
}
