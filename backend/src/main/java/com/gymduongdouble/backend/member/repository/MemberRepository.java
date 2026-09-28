package com.gymduongdouble.backend.member.repository;

import com.gymduongdouble.backend.member.domain.Member;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MemberRepository extends JpaRepository<Member, Long> {
    Optional<Member> findByPhone(String phone);
    boolean existsByPhoneAndIdNot(String phone, Long id);
    List<Member> findByFullNameContainingIgnoreCaseOrPhoneContaining(String fullName, String phone);
}
