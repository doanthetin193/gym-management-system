package com.gymduongdouble.backend.pt.domain;

import com.gymduongdouble.backend.common.domain.AuditableEntity;
import com.gymduongdouble.backend.common.enums.PtLevel;
import com.gymduongdouble.backend.user.domain.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "pt_profiles")
public class PtProfile extends AuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "pt_level", nullable = false, length = 20)
    private PtLevel ptLevel;

    private String specialty;

    @Column(columnDefinition = "text")
    private String bio;

    @Column(name = "base_salary", precision = 15, scale = 2)
    private BigDecimal baseSalary = BigDecimal.ZERO;

    @Column(name = "teaching_rate", precision = 5, scale = 2)
    private BigDecimal teachingRate = new BigDecimal("0.30");

    @Column(name = "sales_commission_rate", precision = 5, scale = 2)
    private BigDecimal salesCommissionRate = new BigDecimal("0.10");

    @Column(nullable = false)
    private boolean active = true;
}
