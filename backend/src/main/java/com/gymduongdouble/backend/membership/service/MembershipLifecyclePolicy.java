package com.gymduongdouble.backend.membership.service;

import com.gymduongdouble.backend.common.enums.MembershipStatus;
import com.gymduongdouble.backend.common.enums.SessionPackageStatus;
import com.gymduongdouble.backend.membership.domain.MemberMembership;
import com.gymduongdouble.backend.pt.domain.PtSessionPackage;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class MembershipLifecyclePolicy {

    public boolean isEffective(MemberMembership membership, LocalDate date) {
        MembershipStatus status = effectiveStatus(membership, date);
        return status == MembershipStatus.ACTIVE
            && !membership.getStartDate().isAfter(date)
            && !membership.getEndDate().isBefore(date);
    }

    public MembershipStatus effectiveStatus(MemberMembership membership, LocalDate date) {
        if (membership.getStatus() == MembershipStatus.CANCELLED) {
            return MembershipStatus.CANCELLED;
        }
        return membership.getEndDate().isBefore(date) ? MembershipStatus.EXPIRED : membership.getStatus();
    }

    public SessionPackageStatus effectiveStatus(PtSessionPackage sessionPackage, LocalDate date) {
        MembershipStatus membershipStatus = effectiveStatus(sessionPackage.getMembership(), date);
        if (membershipStatus == MembershipStatus.CANCELLED) {
            return SessionPackageStatus.CANCELLED;
        }
        if (membershipStatus == MembershipStatus.EXPIRED) {
            return SessionPackageStatus.EXPIRED;
        }
        if (sessionPackage.getStatus() == SessionPackageStatus.CANCELLED
            || sessionPackage.getStatus() == SessionPackageStatus.COMPLETED) {
            return sessionPackage.getStatus();
        }
        return sessionPackage.getEndDate().isBefore(date)
            ? SessionPackageStatus.EXPIRED
            : sessionPackage.getStatus();
    }

    public boolean isEffective(PtSessionPackage sessionPackage, LocalDate date) {
        return effectiveStatus(sessionPackage, date) == SessionPackageStatus.ACTIVE
            && !sessionPackage.getStartDate().isAfter(date)
            && !sessionPackage.getEndDate().isBefore(date)
            && effectiveStatus(sessionPackage.getMembership(), date) == MembershipStatus.ACTIVE;
    }

    public Optional<MemberMembership> preferredMembership(List<MemberMembership> memberships, LocalDate date) {
        List<MemberMembership> available = memberships.stream()
            .filter(membership -> membership.getStatus() != MembershipStatus.CANCELLED)
            .toList();

        return available.stream()
            .filter(membership -> isEffective(membership, date))
            .max(Comparator.comparing(MemberMembership::getStartDate).thenComparing(MemberMembership::getEndDate))
            .or(() -> available.stream()
                .filter(membership -> membership.getStartDate().isAfter(date))
                .min(Comparator.comparing(MemberMembership::getStartDate).thenComparing(MemberMembership::getEndDate)))
            .or(() -> available.stream()
                .filter(membership -> membership.getEndDate().isBefore(date))
                .max(Comparator.comparing(MemberMembership::getEndDate).thenComparing(MemberMembership::getStartDate)));
    }
}
