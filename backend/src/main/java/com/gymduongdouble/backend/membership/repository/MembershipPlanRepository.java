package com.gymduongdouble.backend.membership.repository;

import com.gymduongdouble.backend.membership.domain.MembershipPlan;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MembershipPlanRepository extends JpaRepository<MembershipPlan, Long> {
    List<MembershipPlan> findByActiveTrueOrderByNameAsc();
}
