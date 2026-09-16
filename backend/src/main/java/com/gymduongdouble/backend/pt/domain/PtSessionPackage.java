package com.gymduongdouble.backend.pt.domain;

import com.gymduongdouble.backend.common.domain.AuditableEntity;
import com.gymduongdouble.backend.common.enums.SessionPackageStatus;
import com.gymduongdouble.backend.member.domain.Member;
import com.gymduongdouble.backend.membership.domain.MemberMembership;
import com.gymduongdouble.backend.user.domain.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "pt_session_packages")
public class PtSessionPackage extends AuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pt_user_id")
    private User ptUser;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "membership_id", nullable = false)
    private MemberMembership membership;

    @Column(name = "total_pt_sessions", nullable = false)
    private Integer totalPtSessions = 0;

    @Column(name = "used_pt_sessions", nullable = false)
    private Integer usedPtSessions = 0;

    @Column(name = "remaining_pt_sessions", nullable = false)
    private Integer remainingPtSessions = 0;

    @Column(name = "total_practice_sessions", nullable = false)
    private Integer totalPracticeSessions = 0;

    @Column(name = "used_practice_sessions", nullable = false)
    private Integer usedPracticeSessions = 0;

    @Column(name = "remaining_practice_sessions", nullable = false)
    private Integer remainingPracticeSessions = 0;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private SessionPackageStatus status = SessionPackageStatus.ACTIVE;
}
