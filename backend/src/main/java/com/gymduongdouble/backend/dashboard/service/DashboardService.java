package com.gymduongdouble.backend.dashboard.service;

import com.gymduongdouble.backend.common.enums.BusinessGoalCategory;
import com.gymduongdouble.backend.common.enums.BusinessGoalMetric;
import com.gymduongdouble.backend.common.enums.DebtStatus;
import com.gymduongdouble.backend.common.enums.FinancialTransactionType;
import com.gymduongdouble.backend.common.enums.MembershipStatus;
import com.gymduongdouble.backend.common.enums.PlanType;
import com.gymduongdouble.backend.common.enums.PtLevel;
import com.gymduongdouble.backend.common.enums.SessionPackageStatus;
import com.gymduongdouble.backend.common.exception.ResourceNotFoundException;
import com.gymduongdouble.backend.common.security.SecurityUtils;
import com.gymduongdouble.backend.dashboard.domain.BusinessGoal;
import com.gymduongdouble.backend.dashboard.repository.BusinessGoalRepository;
import com.gymduongdouble.backend.dashboard.web.dto.BusinessGoalProgressItemResponse;
import com.gymduongdouble.backend.dashboard.web.dto.BusinessGoalProgressResponse;
import com.gymduongdouble.backend.dashboard.web.dto.BusinessGoalRequest;
import com.gymduongdouble.backend.dashboard.web.dto.BusinessGoalResponse;
import com.gymduongdouble.backend.dashboard.web.dto.FinanceReportResponse;
import com.gymduongdouble.backend.dashboard.web.dto.FinanceReportRowResponse;
import com.gymduongdouble.backend.dashboard.web.dto.MemberReportResponse;
import com.gymduongdouble.backend.dashboard.web.dto.NotificationResponse;
import com.gymduongdouble.backend.dashboard.web.dto.OwnerDashboardResponse;
import com.gymduongdouble.backend.finance.domain.DebtRecord;
import com.gymduongdouble.backend.finance.domain.FinancialTransaction;
import com.gymduongdouble.backend.finance.repository.DebtRecordRepository;
import com.gymduongdouble.backend.finance.repository.FinancialTransactionRepository;
import com.gymduongdouble.backend.member.domain.Member;
import com.gymduongdouble.backend.member.repository.MemberRepository;
import com.gymduongdouble.backend.membership.domain.MemberMembership;
import com.gymduongdouble.backend.membership.repository.MemberMembershipRepository;
import com.gymduongdouble.backend.pt.domain.PtSessionPackage;
import com.gymduongdouble.backend.pt.repository.PtSessionPackageRepository;
import com.gymduongdouble.backend.user.domain.User;
import com.gymduongdouble.backend.user.repository.UserRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private static final int EXPIRING_SOON_DAYS = 7;
    private static final int LOW_PT_SESSION_THRESHOLD = 2;

    private final BusinessGoalRepository businessGoalRepository;
    private final MemberRepository memberRepository;
    private final MemberMembershipRepository memberMembershipRepository;
    private final FinancialTransactionRepository financialTransactionRepository;
    private final DebtRecordRepository debtRecordRepository;
    private final PtSessionPackageRepository ptSessionPackageRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public OwnerDashboardResponse ownerDashboard(Integer year, Integer month) {
        YearMonth period = resolvePeriod(year, month);
        LocalDate today = LocalDate.now();
        FinanceTotals financeTotals = financeTotals(period.atDay(1), period.atEndOfMonth());
        MemberReportResponse memberReport = memberReport(period.getYear(), period.getMonthValue());
        BigDecimal totalDebt = openDebts().stream()
            .map(DebtRecord::getRemainingAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        List<MemberMembership> currentMemberships = currentMembershipsByMember();

        long totalMembers = memberRepository.count();
        long activeMembers = currentMemberships.stream()
            .filter(membership -> isActiveMembership(membership, today))
            .count();

        return new OwnerDashboardResponse(
            totalMembers,
            activeMembers,
            memberReport.expiringSoon(),
            memberReport.expired(),
            memberReport.newMembers(),
            memberReport.renewedMembers(),
            financeTotals.income(),
            financeTotals.expense(),
            financeTotals.profit(),
            totalDebt,
            notifications().size()
        );
    }

    @Transactional(readOnly = true)
    public List<BusinessGoalResponse> listGoals(Integer year, Integer month) {
        List<BusinessGoal> goals = year == null || month == null
            ? businessGoalRepository.findAllByOrderByYearDescMonthDescCategoryAscMetricNameAsc()
            : businessGoalRepository.findByYearAndMonth(year, month);

        return goals.stream()
            .map(BusinessGoalResponse::from)
            .toList();
    }

    @Transactional
    public BusinessGoalResponse createGoal(BusinessGoalRequest request) {
        BusinessGoal goal = new BusinessGoal();
        applyGoal(goal, request);
        goal.setCreatedBy(currentUserOrNull());
        return BusinessGoalResponse.from(businessGoalRepository.save(goal));
    }

    @Transactional
    public BusinessGoalResponse updateGoal(Long id, BusinessGoalRequest request) {
        BusinessGoal goal = businessGoalRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy mục tiêu kinh doanh."));
        applyGoal(goal, request);
        return BusinessGoalResponse.from(goal);
    }

    @Transactional(readOnly = true)
    public BusinessGoalProgressResponse goalProgress(Integer year, Integer month) {
        YearMonth period = resolvePeriod(year, month);
        List<BusinessGoalProgressItemResponse> items = businessGoalRepository
            .findByYearAndMonth(period.getYear(), period.getMonthValue())
            .stream()
            .map(goal -> {
                boolean manual = goal.getActualValueOverride() != null;
                BigDecimal actual = manual ? goal.getActualValueOverride() : actualFor(goal, period);
                return new BusinessGoalProgressItemResponse(
                    goal.getId(),
                    goal.getCategory(),
                    goal.getMetricName(),
                    goal.getTargetValue(),
                    actual,
                    progressPercent(actual, goal.getTargetValue()),
                    goal.getUnit(),
                    goal.getNote(),
                    manual
                );
            })
            .toList();

        return new BusinessGoalProgressResponse(period.getYear(), period.getMonthValue(), items);
    }

    @Transactional(readOnly = true)
    public FinanceReportResponse financeReport(Integer year, Integer month) {
        int resolvedYear = year == null ? LocalDate.now().getYear() : year;

        if (month != null) {
            YearMonth period = YearMonth.of(resolvedYear, month);
            FinanceTotals totals = financeTotals(period.atDay(1), period.atEndOfMonth());
            return new FinanceReportResponse(
                resolvedYear,
                month,
                totals.income(),
                totals.expense(),
                totals.profit(),
                List.of(new FinanceReportRowResponse(month, totals.income(), totals.expense(), totals.profit()))
            );
        }

        List<FinanceReportRowResponse> rows = java.util.stream.IntStream.rangeClosed(1, 12)
            .mapToObj(currentMonth -> {
                YearMonth period = YearMonth.of(resolvedYear, currentMonth);
                FinanceTotals totals = financeTotals(period.atDay(1), period.atEndOfMonth());
                return new FinanceReportRowResponse(currentMonth, totals.income(), totals.expense(), totals.profit());
            })
            .toList();

        BigDecimal totalIncome = rows.stream().map(FinanceReportRowResponse::income).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalExpense = rows.stream().map(FinanceReportRowResponse::expense).reduce(BigDecimal.ZERO, BigDecimal::add);
        return new FinanceReportResponse(resolvedYear, null, totalIncome, totalExpense, totalIncome.subtract(totalExpense), rows);
    }

    @Transactional(readOnly = true)
    public MemberReportResponse memberReport(Integer year, Integer month) {
        YearMonth period = resolvePeriod(year, month);
        LocalDate start = period.atDay(1);
        LocalDate end = period.atEndOfMonth();
        LocalDate today = LocalDate.now();
        List<MemberMembership> monthMemberships = memberMembershipRepository.findByStartDateBetween(start, end);

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
            .filter(membership -> isActiveMembership(membership, today))
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
        LocalDate today = LocalDate.now();

        List<NotificationResponse> expiring = currentMembershipsByMember().stream()
            .filter(membership -> isActiveMembership(membership, today))
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

    private void applyGoal(BusinessGoal goal, BusinessGoalRequest request) {
        goal.setYear(request.year());
        goal.setMonth(request.month());
        goal.setCategory(request.category());
        goal.setMetricName(request.metricName());
        goal.setTargetValue(request.targetValue());
        goal.setActualValueOverride(request.actualValueOverride());
        goal.setUnit(request.unit());
        goal.setNote(request.note());
    }

    private BigDecimal actualFor(BusinessGoal goal, YearMonth period) {
        FinanceTotals financeTotals = financeTotals(period.atDay(1), period.atEndOfMonth());
        MemberReportResponse memberReport = memberReport(period.getYear(), period.getMonthValue());

        if (goal.getCategory() == BusinessGoalCategory.FINANCE && goal.getMetricName() == BusinessGoalMetric.REVENUE) {
            return financeTotals.income();
        }
        if (goal.getCategory() == BusinessGoalCategory.FINANCE && goal.getMetricName() == BusinessGoalMetric.PROFIT) {
            return financeTotals.profit();
        }
        return BigDecimal.valueOf(switch (goal.getCategory()) {
            case SELF_TRAINING_MEMBER -> memberReport.selfTrainingCustomers();
            case GUIDED_CUSTOMER -> memberReport.guidedCustomers();
            case NEW_PT_CUSTOMER -> memberReport.newPtCustomers();
            case MAIN_PT_CUSTOMER -> memberReport.mainPtCustomers();
            case OTHER, FINANCE -> 0L;
        });
    }

    private FinanceTotals financeTotals(LocalDate start, LocalDate end) {
        List<FinancialTransaction> transactions = financialTransactionRepository.findByTransactionDateBetween(start, end);
        BigDecimal income = transactions.stream()
            .filter(transaction -> transaction.getType() == FinancialTransactionType.INCOME)
            .map(FinancialTransaction::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal expense = transactions.stream()
            .filter(transaction -> transaction.getType() == FinancialTransactionType.EXPENSE)
            .map(FinancialTransaction::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new FinanceTotals(income, expense, income.subtract(expense));
    }

    private boolean hasMembershipBefore(Long memberId, LocalDate date) {
        return memberMembershipRepository.findByMemberIdOrderByStartDateDesc(memberId).stream()
            .anyMatch(membership -> membership.getStartDate().isBefore(date));
    }

    private boolean isActiveMembership(MemberMembership membership, LocalDate today) {
        return membership.getStatus() != MembershipStatus.CANCELLED && !membership.getEndDate().isBefore(today);
    }

    private List<MemberMembership> currentMembershipsByMember() {
        Map<Long, MemberMembership> latestByMember = new HashMap<>();
        memberMembershipRepository.findAll().stream()
            .filter(membership -> membership.getStatus() != MembershipStatus.CANCELLED)
            .forEach(membership -> latestByMember.merge(
                membership.getMember().getId(),
                membership,
                this::latestMembership
            ));
        return new ArrayList<>(latestByMember.values());
    }

    private MemberMembership latestMembership(MemberMembership current, MemberMembership candidate) {
        int endDateCompare = candidate.getEndDate().compareTo(current.getEndDate());
        if (endDateCompare != 0) {
            return endDateCompare > 0 ? candidate : current;
        }
        return candidate.getStartDate().isAfter(current.getStartDate()) ? candidate : current;
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

    private BigDecimal progressPercent(BigDecimal actual, BigDecimal target) {
        if (target == null || target.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return actual.multiply(BigDecimal.valueOf(100)).divide(target, 2, RoundingMode.HALF_UP);
    }

    private YearMonth resolvePeriod(Integer year, Integer month) {
        LocalDate today = LocalDate.now();
        return YearMonth.of(year == null ? today.getYear() : year, month == null ? today.getMonthValue() : month);
    }

    private User currentUserOrNull() {
        Long currentUserId = SecurityUtils.currentUserIdOrNull();
        return currentUserId == null ? null : userRepository.findById(currentUserId).orElse(null);
    }

    private record FinanceTotals(BigDecimal income, BigDecimal expense, BigDecimal profit) {
    }
}
