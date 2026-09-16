package com.gymduongdouble.backend.member.repository;

import com.gymduongdouble.backend.member.domain.MemberNote;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MemberNoteRepository extends JpaRepository<MemberNote, Long> {
    List<MemberNote> findByMemberIdOrderByCreatedAtDesc(Long memberId);
}
