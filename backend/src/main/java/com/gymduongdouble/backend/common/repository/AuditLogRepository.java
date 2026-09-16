package com.gymduongdouble.backend.common.repository;

import com.gymduongdouble.backend.common.domain.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
}
