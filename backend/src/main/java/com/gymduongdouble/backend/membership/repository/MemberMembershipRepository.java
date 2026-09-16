package com.gymduongdouble.backend.membership.repository;

import com.gymduongdouble.backend.membership.domain.MemberMembership;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MemberMembershipRepository extends JpaRepository<MemberMembership, Long> {
    List<MemberMembership> findByMemberIdOrderByStartDateDesc(Long memberId);
    List<MemberMembership> findByEndDateBetween(LocalDate startDate, LocalDate endDate);
}
