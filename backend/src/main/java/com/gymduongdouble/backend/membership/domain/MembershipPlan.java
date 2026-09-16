package com.gymduongdouble.backend.membership.domain;

import com.gymduongdouble.backend.common.domain.AuditableEntity;
import com.gymduongdouble.backend.common.enums.ContentAccessLevel;
import com.gymduongdouble.backend.common.enums.PlanType;
import com.gymduongdouble.backend.common.enums.PtLevel;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "membership_plans")
public class MembershipPlan extends AuditableEntity {

    @Column(nullable = false, length = 150)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "plan_type", nullable = false, length = 30)
    private PlanType planType;

    @Enumerated(EnumType.STRING)
    @Column(name = "pt_level", length = 20)
    private PtLevel ptLevel;

    @Column(name = "duration_days")
    private Integer durationDays;

    @Column(name = "default_price", precision = 15, scale = 2)
    private BigDecimal defaultPrice = BigDecimal.ZERO;

    @Column(name = "pt_session_count")
    private Integer ptSessionCount;

    @Column(name = "practice_session_count")
    private Integer practiceSessionCount;

    @Column(name = "guidance_session_count")
    private Integer guidanceSessionCount;

    @Enumerated(EnumType.STRING)
    @Column(name = "content_access_level", nullable = false, length = 20)
    private ContentAccessLevel contentAccessLevel = ContentAccessLevel.NONE;

    @Column(name = "price_ratio", precision = 5, scale = 2)
    private BigDecimal priceRatio;

    @Column(columnDefinition = "text")
    private String description;

    @Column(nullable = false)
    private boolean active = true;
}
