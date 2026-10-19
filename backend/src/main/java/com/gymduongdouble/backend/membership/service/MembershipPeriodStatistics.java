package com.gymduongdouble.backend.membership.service;

import com.gymduongdouble.backend.common.enums.MembershipStatus;
import com.gymduongdouble.backend.membership.domain.MemberMembership;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

@Component
public class MembershipPeriodStatistics {

    public Counts count(List<MemberMembership> memberships, LocalDate start, LocalDate end) {
        Map<Long, List<MemberMembership>> byMember = memberships.stream()
            .filter(membership -> membership.getStatus() != MembershipStatus.CANCELLED)
            .collect(Collectors.groupingBy(membership -> membership.getMember().getId()));
        Set<Long> newMembers = new HashSet<>();
        Set<Long> renewedMembers = new HashSet<>();
        Comparator<MemberMembership> order = Comparator.comparing(MemberMembership::getStartDate)
            .thenComparing(MemberMembership::getId);

        byMember.forEach((memberId, memberMemberships) -> {
            List<MemberMembership> sorted = memberMemberships.stream().sorted(order).toList();
            for (int i = 0; i < sorted.size(); i++) {
                LocalDate date = sorted.get(i).getStartDate();
                if (!date.isBefore(start) && !date.isAfter(end)) {
                    (i == 0 ? newMembers : renewedMembers).add(memberId);
                }
            }
        });
        return new Counts(newMembers.size(), renewedMembers.size());
    }

    public record Counts(long newMembers, long renewedMembers) {}
}
