package com.gymduongdouble.backend.dashboard.service;

import com.gymduongdouble.backend.common.enums.DebtStatus;
import com.gymduongdouble.backend.common.enums.MemberStatus;
import com.gymduongdouble.backend.common.enums.MembershipStatus;
import com.gymduongdouble.backend.common.enums.PlanType;
import com.gymduongdouble.backend.common.enums.PtLevel;
import com.gymduongdouble.backend.common.enums.SessionPackageStatus;
import com.gymduongdouble.backend.common.time.AppClock;
import com.gymduongdouble.backend.dashboard.web.dto.FinanceReportResponse;
import com.gymduongdouble.backend.dashboard.web.dto.FinanceReportRowResponse;
import com.gymduongdouble.backend.dashboard.web.dto.MemberReportResponse;
import com.gymduongdouble.backend.dashboard.web.dto.NotificationResponse;
import com.gymduongdouble.backend.dashboard.web.dto.OwnerDashboardResponse;
import com.gymduongdouble.backend.finance.domain.DebtRecord;
import com.gymduongdouble.backend.finance.repository.DebtRecordRepository;
import com.gymduongdouble.backend.finance.repository.PaymentRepository;
import com.gymduongdouble.backend.member.domain.Member;
import com.gymduongdouble.backend.member.repository.MemberRepository;
import com.gymduongdouble.backend.membership.domain.MemberMembership;
import com.gymduongdouble.backend.membership.repository.MemberMembershipRepository;
import com.gymduongdouble.backend.membership.service.MembershipLifecyclePolicy;
import com.gymduongdouble.backend.pt.domain.PtSessionPackage;
import com.gymduongdouble.backend.pt.repository.PtSessionPackageRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private static final int EXPIRING_SOON_DAYS = 7;
    private static final int LOW_PT_SESSION_THRESHOLD = 2;

    private final MemberRepository memberRepository;
    private final MemberMembershipRepository memberMembershipRepository;
    private final PaymentRepository paymentRepository;
    private final DebtRecordRepository debtRecordRepository;
    private final PtSessionPackageRepository ptSessionPackageRepository;
    private final MembershipLifecyclePolicy membershipLifecyclePolicy;

    @Transactional(readOnly = true)
    public OwnerDashboardResponse ownerDashboard(Integer year, Integer month) {
        YearMonth period = resolvePeriod(year, month);
        LocalDate today = AppClock.today();
        BigDecimal monthlyRevenue = revenueBetween(period.atDay(1), period.atEndOfMonth());
        MemberReportResponse memberReport = memberReport(period.getYear(), period.getMonthValue());
        BigDecimal totalDebt = openDebts().stream()
            .map(DebtRecord::getRemainingAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        List<MemberMembership> currentMemberships = currentMembershipsByMember();

        long totalMembers = memberRepository.count();
        long activeMembers = currentMemberships.stream()
            .filter(membership -> membershipLifecyclePolicy.isEffective(membership, today))
            .count();

        return new OwnerDashboardResponse(
            totalMembers,
            activeMembers,
            memberReport.expiringSoon(),
            memberReport.expired(),
            memberReport.newMembers(),
            memberReport.renewedMembers(),
            monthlyRevenue,
            totalDebt,
            notifications().size()
        );
    }

    @Transactional(readOnly = true)
    public FinanceReportResponse financeReport(Integer year, Integer month) {
        int resolvedYear = year == null ? AppClock.today().getYear() : year;

        if (month != null) {
            YearMonth period = YearMonth.of(resolvedYear, month);
            BigDecimal revenue = revenueBetween(period.atDay(1), period.atEndOfMonth());
            return new FinanceReportResponse(
                resolvedYear,
                month,
                revenue,
                List.of(new FinanceReportRowResponse(month, revenue))
            );
        }

        List<FinanceReportRowResponse> rows = java.util.stream.IntStream.rangeClosed(1, 12)
            .mapToObj(currentMonth -> {
                YearMonth period = YearMonth.of(resolvedYear, currentMonth);
                BigDecimal revenue = revenueBetween(period.atDay(1), period.atEndOfMonth());
                return new FinanceReportRowResponse(currentMonth, revenue);
            })
            .toList();

        BigDecimal totalIncome = rows.stream().map(FinanceReportRowResponse::income).reduce(BigDecimal.ZERO, BigDecimal::add);
        return new FinanceReportResponse(resolvedYear, null, totalIncome, rows);
    }

    @Transactional(readOnly = true)
    public MemberReportResponse memberReport(Integer year, Integer month) {
        YearMonth period = resolvePeriod(year, month);
        LocalDate start = period.atDay(1);
        LocalDate end = period.atEndOfMonth();
        LocalDate today = AppClock.today();
        List<MemberMembership> monthMemberships = memberMembershipRepository.findByStartDateBetween(start, end).stream()
            .filter(membership -> membership.getStatus() != MembershipStatus.CANCELLED)
            .toList();

        Set<Long> newMembers = new HashSet<>();
        Set<Long> renewedMembers = new HashSet<>();
        Set<Long> selfTraining = new HashSet<>();
        Set<Long> guided = new HashSet<>();
        Set<Long> newPt = new HashSet<>();
        Set<Long> mainPt = new HashSet<>();

        for (MemberMembership membership : monthMemberships) {
            Long memberId = membership.getMember().getId();
            if (hasMembershipBefore(memberId, start)) {
                renewedMembers.add(memberId);
            } else {
                newMembers.add(memberId);
            }

            PlanType planType = membership.getPlan().getPlanType();
            if (planType == PlanType.SELF_TRAINING) {
                selfTraining.add(memberId);
            } else if (planType == PlanType.GUIDANCE) {
                guided.add(memberId);
            } else if (planType == PlanType.PT && membership.getPlan().getPtLevel() == PtLevel.NEW) {
                newPt.add(memberId);
            } else if (planType == PlanType.PT) {
                mainPt.add(memberId);
            }
        }

        List<MemberMembership> currentMemberships = currentMembershipsByMember();
        long expiringSoon = currentMemberships.stream()
            .filter(membership -> membershipLifecyclePolicy.isEffective(membership, today))
            .filter(membership -> !membership.getEndDate().isAfter(today.plusDays(EXPIRING_SOON_DAYS)))
            .count();
        long expired = currentMemberships.stream()
            .filter(membership -> membership.getEndDate().isBefore(today))
            .count();

        return new MemberReportResponse(
            period.getYear(),
            period.getMonthValue(),
            newMembers.size(),
            renewedMembers.size(),
            selfTraining.size(),
            guided.size(),
            newPt.size(),
            mainPt.size(),
            expiringSoon,
            expired
        );
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> notifications() {
        LocalDate today = AppClock.today();

        List<NotificationResponse> expiring = currentMembershipsByMember().stream()
            .filter(membership -> membershipLifecyclePolicy.isEffective(membership, today))
            .filter(membership -> !membership.getEndDate().isAfter(today.plusDays(EXPIRING_SOON_DAYS)))
            .map(membership -> notification(
                "EXPIRING-" + membership.getId(),
                "EXPIRING_MEMBERSHIP",
                "Khách sắp hết hạn gói",
                membership.getMember(),
                membership.getEndDate(),
                null,
                membership.getMember().getFullName() + " hết hạn gói vào " + membership.getEndDate()
            ))
            .toList();

        List<NotificationResponse> birthdays = memberRepository.findAll().stream()
            .filter(member -> member.getStatus() == MemberStatus.ACTIVE)
            .filter(member -> member.getDateOfBirth() != null)
            .filter(member -> isBirthdayInNextDays(member.getDateOfBirth(), today, EXPIRING_SOON_DAYS))
            .map(member -> notification(
                "BIRTHDAY-" + member.getId(),
                "BIRTHDAY",
                "Sinh nhật khách hàng",
                member,
                nextBirthday(member.getDateOfBirth(), today),
                null,
                "Sắp tới sinh nhật của " + member.getFullName()
            ))
            .toList();

        List<NotificationResponse> debts = openDebts().stream()
            .map(debt -> notification(
                "DEBT-" + debt.getId(),
                "OPEN_DEBT",
                "Công nợ cần thu",
                debt.getMember(),
                debt.getDueDate(),
                debt.getRemainingAmount(),
                debt.getMember().getFullName() + " còn nợ " + debt.getRemainingAmount() + " VND"
            ))
            .toList();

        List<NotificationResponse> ptLowSessions = ptSessionPackageRepository
            .findByStatusAndRemainingPtSessionsLessThanEqualOrderByRemainingPtSessionsAsc(SessionPackageStatus.ACTIVE, LOW_PT_SESSION_THRESHOLD)
            .stream()
            .filter(sessionPackage -> sessionPackage.getMember().getStatus() == MemberStatus.ACTIVE)
            .filter(sessionPackage -> membershipLifecyclePolicy.isEffective(sessionPackage, today))
            .map(sessionPackage -> notification(
                "PT-LOW-" + sessionPackage.getId(),
                "LOW_PT_SESSIONS",
                "Khách PT còn ít buổi",
                sessionPackage.getMember(),
                sessionPackage.getEndDate(),
                BigDecimal.valueOf(sessionPackage.getRemainingPtSessions()),
                sessionPackage.getMember().getFullName() + " còn " + sessionPackage.getRemainingPtSessions() + " buổi PT"
            ))
            .toList();

        return java.util.stream.Stream.of(expiring, birthdays, debts, ptLowSessions)
            .flatMap(List::stream)
            .sorted(Comparator.comparing(NotificationResponse::dueDate, Comparator.nullsLast(Comparator.naturalOrder())))
            .toList();
    }

    private BigDecimal revenueBetween(LocalDate start, LocalDate end) {
        return paymentRepository.sumAmountByPaymentDateBetween(start, end);
    }

    private boolean hasMembershipBefore(Long memberId, LocalDate date) {
        return memberMembershipRepository.findByMemberIdOrderByStartDateDesc(memberId).stream()
            .filter(membership -> membership.getStatus() != MembershipStatus.CANCELLED)
            .anyMatch(membership -> membership.getStartDate().isBefore(date));
    }

    private List<MemberMembership> currentMembershipsByMember() {
        LocalDate today = AppClock.today();
        Map<Long, List<MemberMembership>> membershipsByMember = memberMembershipRepository.findAll().stream()
            .filter(membership -> membership.getStatus() != MembershipStatus.CANCELLED)
            .filter(membership -> membership.getMember().getStatus() == MemberStatus.ACTIVE)
            .collect(Collectors.groupingBy(membership -> membership.getMember().getId()));
        return membershipsByMember.values().stream()
            .map(memberships -> membershipLifecyclePolicy.preferredMembership(memberships, today))
            .flatMap(java.util.Optional::stream)
            .toList();
    }

    private List<DebtRecord> openDebts() {
        return debtRecordRepository.findByStatusInOrderByDueDateAsc(List.of(DebtStatus.OPEN, DebtStatus.PARTIALLY_PAID)).stream()
            .filter(debt -> debt.getRemainingAmount().compareTo(BigDecimal.ZERO) > 0)
            .toList();
    }

    private boolean isBirthdayInNextDays(LocalDate birthday, LocalDate today, int days) {
        LocalDate nextBirthday = nextBirthday(birthday, today);
        return !nextBirthday.isBefore(today) && !nextBirthday.isAfter(today.plusDays(days));
    }

    private LocalDate nextBirthday(LocalDate birthday, LocalDate today) {
        LocalDate next = birthday.withYear(today.getYear());
        if (next.isBefore(today)) {
            next = next.plusYears(1);
        }
        return next;
    }

    private NotificationResponse notification(
        String id,
        String type,
        String title,
        Member member,
        LocalDate dueDate,
        BigDecimal amount,
        String message
    ) {
        return new NotificationResponse(id, type, title, message, member.getId(), member.getFullName(), dueDate, amount, false);
    }

    private YearMonth resolvePeriod(Integer year, Integer month) {
        LocalDate today = AppClock.today();
        return YearMonth.of(year == null ? today.getYear() : year, month == null ? today.getMonthValue() : month);
    }

}
