package com.gymduongdouble.backend.training.domain;

import com.gymduongdouble.backend.common.domain.BaseEntity;
import com.gymduongdouble.backend.member.domain.Member;
import com.gymduongdouble.backend.user.domain.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "body_measurements")
@EntityListeners(AuditingEntityListener.class)
public class BodyMeasurement extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recorded_by")
    private User recordedBy;

    @Column(name = "recorded_at", nullable = false)
    private Instant recordedAt;

    @Column(precision = 8, scale = 2)
    private BigDecimal height;

    @Column(precision = 8, scale = 2)
    private BigDecimal weight;

    @Column(precision = 8, scale = 2)
    private BigDecimal chest;

    @Column(precision = 8, scale = 2)
    private BigDecimal waist;

    @Column(precision = 8, scale = 2)
    private BigDecimal abdomen;

    @Column(precision = 8, scale = 2)
    private BigDecimal hip;

    @Column(precision = 8, scale = 2)
    private BigDecimal thigh;

    @Column(precision = 8, scale = 2)
    private BigDecimal arm;

    @Column(columnDefinition = "text")
    private String note;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
