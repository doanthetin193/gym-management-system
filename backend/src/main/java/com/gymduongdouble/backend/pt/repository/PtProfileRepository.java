package com.gymduongdouble.backend.pt.repository;

import com.gymduongdouble.backend.pt.domain.PtProfile;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PtProfileRepository extends JpaRepository<PtProfile, Long> {
    Optional<PtProfile> findByUserId(Long userId);
}
