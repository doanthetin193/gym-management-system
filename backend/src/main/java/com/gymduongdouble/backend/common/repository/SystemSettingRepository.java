package com.gymduongdouble.backend.common.repository;

import com.gymduongdouble.backend.common.domain.SystemSetting;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SystemSettingRepository extends JpaRepository<SystemSetting, String> {
}
