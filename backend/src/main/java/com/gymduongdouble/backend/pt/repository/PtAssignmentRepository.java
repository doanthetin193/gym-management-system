package com.gymduongdouble.backend.pt.repository;

import com.gymduongdouble.backend.pt.domain.PtAssignment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PtAssignmentRepository extends JpaRepository<PtAssignment, Long> {
    List<PtAssignment> findByPtUserId(Long ptUserId);
    List<PtAssignment> findByMemberId(Long memberId);
}
