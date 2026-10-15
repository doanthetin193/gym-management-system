package com.gymduongdouble.backend.ai.service;

import com.gymduongdouble.backend.ai.client.GroqAiClient;
import com.gymduongdouble.backend.ai.config.GroqAiProperties;
import com.gymduongdouble.backend.ai.web.dto.RetentionRevenueAdvisorRequest;
import com.gymduongdouble.backend.ai.web.dto.RetentionRevenueAdvisorResponse;
import com.gymduongdouble.backend.ai.web.dto.RetentionRevenueAdvisorResponse.AdvisorInsight;
import com.gymduongdouble.backend.ai.web.dto.RetentionRevenueAdvisorResponse.AdvisorSegment;
import com.gymduongdouble.backend.ai.web.dto.RetentionRevenueAdvisorResponse.AdvisorSummary;
import com.gymduongdouble.backend.common.enums.ActivityType;
import com.gymduongdouble.backend.common.enums.DebtStatus;
import com.gymduongdouble.backend.common.enums.MemberStatus;
import com.gymduongdouble.backend.common.enums.PlanType;
import com.gymduongdouble.backend.common.enums.PtSessionStatus;
import com.gymduongdouble.backend.common.time.AppClock;
import com.gymduongdouble.backend.finance.domain.DebtRecord;
import com.gymduongdouble.backend.finance.domain.Payment;
import com.gymduongdouble.backend.finance.repository.DebtRecordRepository;
import com.gymduongdouble.backend.finance.repository.PaymentRepository;
import com.gymduongdouble.backend.member.domain.Member;
import com.gymduongdouble.backend.member.repository.MemberRepository;
import com.gymduongdouble.backend.membership.domain.MemberMembership;
import com.gymduongdouble.backend.membership.repository.MemberMembershipRepository;
import com.gymduongdouble.backend.membership.service.MembershipLifecyclePolicy;
import com.gymduongdouble.backend.pt.domain.MemberActivityLog;
import com.gymduongdouble.backend.pt.domain.PtSessionLog;
import com.gymduongdouble.backend.pt.domain.PtSessionPackage;
import com.gymduongdouble.backend.pt.repository.MemberActivityLogRepository;
import com.gymduongdouble.backend.pt.repository.PtSessionLogRepository;
import com.gymduongdouble.backend.pt.repository.PtSessionPackageRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RetentionRevenueAdvisorService {
    private static final int NEAR_EXPIRY_DAYS = 7;


    private static final String SYSTEM_PROMPT = """
        Bạn là AI cố vấn vận hành cho phòng gym nhỏ DUONG DOUBLE, quy mô 50-70 hội viên.
        Nhiệm vụ: phân tích dữ liệu tổng hợp đã ẩn danh để giúp chủ phòng giữ chân khách và tăng doanh thu tuần tới.
        Không yêu cầu thêm dữ liệu cá nhân, không nhắc đến tên/SĐT/Zalo/email, không tư vấn y tế.
        Chỉ trả JSON hợp lệ với schema:
        {
          "healthStatus": "GOOD|WATCH|RISK",
          "overview": "2-3 câu tiếng Việt ngắn gọn",
          "topRisks": ["tối đa 3 ý"],
          "revenueOpportunities": ["tối đa 3 ý"],
          "actionPlan7Days": ["tối đa 5 hành động cụ thể"],
          "trackingMetrics": ["tối đa 4 chỉ số cần theo dõi"],
          "revenueRiskNote": "1 câu về giá trị liên quan rủi ro cần theo dõi"
        }
        """;

    private final MemberRepository memberRepository;
    private final MemberMembershipRepository memberMembershipRepository;
    private final PaymentRepository paymentRepository;
    private final DebtRecordRepository debtRecordRepository;
    private final PtSessionPackageRepository ptSessionPackageRepository;
    private final PtSessionLogRepository ptSessionLogRepository;
    private final MemberActivityLogRepository memberActivityLogRepository;
    private final GroqAiClient groqAiClient;
    private final GroqAiProperties groqAiProperties;
    private final MembershipLifecyclePolicy membershipLifecyclePolicy;

    @Transactional(readOnly = true)
    public RetentionRevenueAdvisorResponse analyze(RetentionRevenueAdvisorRequest request) {
        YearMonth period = resolvePeriod(request);
        AdvisorPayload payload = buildPayload(period);

        try {
            AiInsightResponse aiInsight = groqAiClient.requestJson(SYSTEM_PROMPT, payload, AiInsightResponse.class);
            return buildResponse(period, true, normalize(aiInsight, null), payload);
        } catch (RuntimeException exception) {
            String message = exception.getMessage() == null ? "AI provider chưa phản hồi ổn định." : exception.getMessage();
            return buildResponse(period, false, fallbackInsight(payload, message), payload);
        }
    }

    private YearMonth resolvePeriod(RetentionRevenueAdvisorRequest request) {
        LocalDate today = AppClock.today();
        int year = request != null && request.year() != null ? request.year() : today.getYear();
        int month = request != null && request.month() != null ? request.month() : today.getMonthValue();
        return YearMonth.of(year, month);
    }

    private AdvisorPayload buildPayload(YearMonth period) {
        LocalDate today = AppClock.today();
        LocalDate monthStart = period.atDay(1);
        LocalDate monthEnd = period.atEndOfMonth();
        YearMonth previousPeriod = period.minusMonths(1);

        List<Member> members = memberRepository.findAll().stream()
            .filter(member -> member.getStatus() == MemberStatus.ACTIVE)
            .toList();
        List<MemberMembership> memberships = memberMembershipRepository.findAll();
        List<Payment> currentPayments = paymentRepository.findByPaymentDateBetween(monthStart, monthEnd);
        List<Payment> previousPayments = paymentRepository.findByPaymentDateBetween(previousPeriod.atDay(1), previousPeriod.atEndOfMonth());
        List<DebtRecord> activeDebts = debtRecordRepository.findByStatusInOrderByDueDateAsc(List.of(DebtStatus.OPEN, DebtStatus.PARTIALLY_PAID)).stream()
            .filter(debt -> money(debt.getRemainingAmount()) > 0)
            .toList();
        List<PtSessionPackage> ptPackages = ptSessionPackageRepository.findAll();

        Map<Long, List<MemberMembership>> membershipsByMember = memberships.stream()
            .collect(Collectors.groupingBy(membership -> membership.getMember().getId()));
        Map<Long, List<DebtRecord>> debtsByMember = activeDebts.stream()
            .collect(Collectors.groupingBy(debt -> debt.getMember().getId()));
        Map<Long, List<PtSessionPackage>> ptPackagesByMember = ptPackages.stream()
            .collect(Collectors.groupingBy(sessionPackage -> sessionPackage.getMember().getId()));
        Map<Long, LocalDate> latestActivityByMember = latestActivityByMember();

        MutableSegments riskSegments = new MutableSegments();
        MutableSegments opportunitySegments = new MutableSegments();
        long activeMembers = 0;
        long expiredMembers = 0;
        long nearExpiryMembers = 0;
        long highRisk = 0;
        long mediumRisk = 0;
        Map<Long, Long> renewalOpportunityByMember = new LinkedHashMap<>();

        for (Member member : members) {
            List<MemberMembership> memberMemberships = membershipsByMember.getOrDefault(member.getId(), List.of());
            Optional<MemberMembership> preferredMembership = membershipLifecyclePolicy.preferredMembership(memberMemberships, today);
            Optional<MemberMembership> activeMembership = memberMemberships.stream()
                .filter(membership -> membershipLifecyclePolicy.isEffective(membership, today))
                .max(Comparator.comparing(MemberMembership::getStartDate).thenComparing(MemberMembership::getEndDate));
            boolean hasOpenDebt = debtsByMember.containsKey(member.getId());
            long memberDebt = debtsByMember.getOrDefault(member.getId(), List.of()).stream()
                .map(DebtRecord::getRemainingAmount)
                .mapToLong(this::money)
                .sum();

            if (activeMembership.isPresent()) {
                activeMembers += 1;
                MemberMembership membership = activeMembership.get();
                long value = money(membership.getActualPrice());
                long daysToEnd = ChronoUnit.DAYS.between(today, membership.getEndDate());
                PlanType planType = membership.getPlan().getPlanType();

                if (daysToEnd <= NEAR_EXPIRY_DAYS) {
                    nearExpiryMembers += 1;
                    mediumRisk += 1;
                    markRenewalOpportunity(renewalOpportunityByMember, member, value);
                    riskSegments.add(segmentCode(planType, "NEAR_EXPIRY"), segmentLabel(planType, "sắp hết hạn"), value);
                    opportunitySegments.add(segmentCode(planType, "RENEWAL_WINDOW"), segmentLabel(planType, "đang trong cửa sổ gia hạn"), value);
                }

                if (hasOpenDebt) {
                    mediumRisk += 1;
                    riskSegments.add("OPEN_DEBT_ACTIVE_MEMBER", "Khách đang tập nhưng còn công nợ", memberDebt);
                    opportunitySegments.add("DEBT_COLLECTION", "Công nợ có thể thu hồi", memberDebt);
                }

                if (memberMemberships.size() == 1 && daysToEnd <= 14) {
                    riskSegments.add("FIRST_PACKAGE_NEAR_EXPIRY", "Khách mới mua gói đầu tiên sắp hết hạn", value);
                }

                if (planType == PlanType.PT) {
                    PtRisk ptRisk = analyzePtRisk(ptPackagesByMember.getOrDefault(member.getId(), List.of()), latestActivityByMember.get(member.getId()), today);
                    if (ptRisk.unusedNearExpiry()) {
                        highRisk += 1;
                        markRenewalOpportunity(renewalOpportunityByMember, member, value);
                        riskSegments.add("PT_NEAR_EXPIRY_UNUSED_SESSIONS", "Khách PT gần hết hạn nhưng còn nhiều buổi", value);
                        opportunitySegments.add("PT_RENEWAL_OR_SESSION_RECOVERY", "Khôi phục lịch PT hoặc gia hạn PT", value);
                    }
                    if (ptRisk.longInactive()) {
                        mediumRisk += 1;
                        riskSegments.add("LONG_INACTIVE_PT_MEMBER", "Khách PT gián đoạn lịch tập lâu ngày", value);
                    }
                }
            } else if (preferredMembership.isPresent() && preferredMembership.get().getEndDate().isBefore(today)) {
                expiredMembers += 1;
                MemberMembership membership = preferredMembership.get();
                long value = money(membership.getActualPrice());
                long expiredDays = ChronoUnit.DAYS.between(membership.getEndDate(), today);

                if (expiredDays > 7) {
                    highRisk += 1;
                } else {
                    mediumRisk += 1;
                }
                markRenewalOpportunity(renewalOpportunityByMember, member, value);
                riskSegments.add(segmentCode(membership.getPlan().getPlanType(), expiredDays > 7 ? "EXPIRED_OVER_7_DAYS" : "EXPIRED_RECENTLY"), segmentLabel(membership.getPlan().getPlanType(), expiredDays > 7 ? "đã hết hạn hơn 7 ngày" : "vừa hết hạn"), value);
                opportunitySegments.add(segmentCode(membership.getPlan().getPlanType(), "WINBACK"), segmentLabel(membership.getPlan().getPlanType(), "có thể chăm sóc quay lại"), value);
            }
        }

        long currentRevenue = currentPayments.stream().map(Payment::getAmount).mapToLong(this::money).sum();
        long previousRevenue = previousPayments.stream().map(Payment::getAmount).mapToLong(this::money).sum();
        long openDebtAmount = activeDebts.stream().map(DebtRecord::getRemainingAmount).mapToLong(this::money).sum();
        long renewalOpportunityValue = renewalOpportunityByMember.values().stream().mapToLong(Long::longValue).sum();
        long newMembersThisMonth = countNewMembers(membershipsByMember, monthStart, monthEnd);
        long renewalsThisMonth = countRenewals(membershipsByMember, monthStart, monthEnd);

        AdvisorSummary summary = new AdvisorSummary(
            members.size(),
            activeMembers,
            expiredMembers,
            nearExpiryMembers,
            highRisk,
            mediumRisk,
            activeDebts.size(),
            newMembersThisMonth,
            renewalsThisMonth,
            currentRevenue,
            previousRevenue,
            renewalOpportunityValue,
            openDebtAmount
        );

        Map<String, Long> sourceMix = members.stream()
            .collect(Collectors.groupingBy(member -> member.getSource() == null ? "UNKNOWN" : member.getSource().name(), LinkedHashMap::new, Collectors.counting()));

        Map<String, Long> revenueByPlanType = currentPayments.stream()
            .filter(payment -> payment.getMembership() != null && payment.getMembership().getPlan() != null)
            .collect(Collectors.groupingBy(
                payment -> payment.getMembership().getPlan().getPlanType().name(),
                LinkedHashMap::new,
                Collectors.summingLong(payment -> money(payment.getAmount()))
            ));

        return new AdvisorPayload(
            period.toString(),
            summary,
            riskSegments.toResponses(),
            opportunitySegments.toResponses(),
            sourceMix,
            revenueByPlanType
        );
    }

    private Map<Long, LocalDate> latestActivityByMember() {
        Map<Long, LocalDate> latest = new LinkedHashMap<>();
        for (PtSessionLog log : ptSessionLogRepository.findAll()) {
            if (log.getStatus() == PtSessionStatus.COMPLETED) {
                latest.merge(log.getMember().getId(), log.getSessionDate(), this::maxDate);
            }
        }
        for (MemberActivityLog log : memberActivityLogRepository.findAll()) {
            if (log.getActivityType() == ActivityType.PRACTICE || log.getActivityType() == ActivityType.GUIDANCE_CHECKIN) {
                latest.merge(log.getMember().getId(), log.getActivityDate(), this::maxDate);
            }
        }
        return latest;
    }

    private PtRisk analyzePtRisk(List<PtSessionPackage> packages, LocalDate latestActivity, LocalDate today) {
        return packages.stream()
            .filter(sessionPackage -> membershipLifecyclePolicy.isEffective(sessionPackage, today))
            .findFirst()
            .map(sessionPackage -> {
                int total = Math.max(1, sessionPackage.getTotalPtSessions());
                int remaining = Math.max(0, sessionPackage.getRemainingPtSessions());
                long daysToEnd = ChronoUnit.DAYS.between(today, sessionPackage.getEndDate());
                boolean unusedNearExpiry = daysToEnd <= 14 && remaining >= Math.ceil(total * 0.35);
                boolean longInactive = latestActivity == null || latestActivity.isBefore(today.minusDays(21));
                return new PtRisk(unusedNearExpiry, longInactive);
            })
            .orElse(new PtRisk(false, false));
    }

    private long countNewMembers(Map<Long, List<MemberMembership>> membershipsByMember, LocalDate start, LocalDate end) {
        return membershipsByMember.values().stream()
            .filter(memberships -> memberships.stream()
                .map(MemberMembership::getStartDate)
                .min(LocalDate::compareTo)
                .filter(date -> !date.isBefore(start) && !date.isAfter(end))
                .isPresent())
            .count();
    }

    private long countRenewals(Map<Long, List<MemberMembership>> membershipsByMember, LocalDate start, LocalDate end) {
        return membershipsByMember.values().stream()
            .filter(memberships -> memberships.size() > 1)
            .flatMap(List::stream)
            .filter(membership -> !membership.getStartDate().isBefore(start) && !membership.getStartDate().isAfter(end))
            .count();
    }

    private RetentionRevenueAdvisorResponse buildResponse(YearMonth period, boolean aiGenerated, AdvisorInsight insight, AdvisorPayload payload) {
        return new RetentionRevenueAdvisorResponse(
            period.getYear(),
            period.getMonthValue(),
            aiGenerated,
            groqAiProperties.getModel(),
            Instant.now(),
            payload.summary(),
            payload.riskSegments(),
            payload.opportunitySegments(),
            insight
        );
    }

    private AdvisorInsight normalize(AiInsightResponse response, String providerMessage) {
        return new AdvisorInsight(
            safeText(response.healthStatus(), "WATCH"),
            safeText(response.overview(), "AI đã phân tích dữ liệu tổng hợp và đưa ra khuyến nghị vận hành."),
            safeList(response.topRisks()),
            safeList(response.revenueOpportunities()),
            safeList(response.actionPlan7Days()),
            safeList(response.trackingMetrics()),
            safeText(response.revenueRiskNote(), "Theo dõi nhóm hết hạn, công nợ và PT còn buổi để giảm giá trị rủi ro."),
            providerMessage
        );
    }

    private AdvisorInsight fallbackInsight(AdvisorPayload payload, String providerMessage) {
        AdvisorSummary summary = payload.summary();
        List<String> risks = payload.riskSegments().stream()
            .limit(3)
            .map(segment -> segment.label() + ": " + segment.count() + " khách")
            .toList();
        List<String> opportunities = payload.opportunitySegments().stream()
            .limit(3)
            .map(segment -> segment.label() + ": " + segment.count() + " khách")
            .toList();

        String status = summary.highRiskChurn() > 0 ? "RISK" : summary.mediumRiskChurn() > 0 ? "WATCH" : "GOOD";
        return new AdvisorInsight(
            status,
            "Hệ thống đã tạo phân tích rule-based từ dữ liệu tổng hợp. AI provider chưa phản hồi ổn định nên chưa có diễn giải chiến lược đầy đủ.",
            risks,
            opportunities,
            List.of(
                "Ưu tiên gọi nhóm rủi ro cao trong 24 giờ.",
                "Chốt lịch tập lại cho khách PT còn nhiều buổi nhưng gần hết hạn.",
                "Tách danh sách công nợ và thu từng phần theo mức dễ xử lý trước.",
                "Theo dõi nhóm sắp hết hạn trong 7 ngày tới."
            ),
            List.of("Số khách hết hạn", "Số khách sắp hết hạn", "Công nợ còn mở", "Giá trị liên quan rủi ro"),
            "Cơ hội gia hạn/quay lại khoảng " + summary.renewalOpportunityValue()
                + " VND; công nợ cần thu riêng là " + summary.openDebtAmount() + " VND.",
            providerMessage
        );
    }

    private String segmentCode(PlanType planType, String suffix) {
        return planType.name() + "_" + suffix;
    }

    private String segmentLabel(PlanType planType, String action) {
        return switch (planType) {
            case SELF_TRAINING -> "Khách tự tập " + action;
            case PT -> "Khách PT " + action;
            case GUIDANCE -> "Khách giáo án/hướng dẫn " + action;
            case OTHER -> "Khách gói khác " + action;
        };
    }

    private LocalDate maxDate(LocalDate left, LocalDate right) {
        return left.isAfter(right) ? left : right;
    }

    private long money(BigDecimal value) {
        return value == null ? 0L : value.longValue();
    }

    private void markRenewalOpportunity(Map<Long, Long> renewalOpportunityByMember, Member member, long value) {
        if (member != null && value > 0) {
            renewalOpportunityByMember.merge(member.getId(), value, Math::max);
        }
    }

    private String safeText(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private List<String> safeList(List<String> values) {
        if (values == null) {
            return List.of();
        }
        return values.stream()
            .filter(value -> value != null && !value.isBlank())
            .map(String::trim)
            .limit(5)
            .toList();
    }

    private record AdvisorPayload(
        String month,
        AdvisorSummary summary,
        List<AdvisorSegment> riskSegments,
        List<AdvisorSegment> opportunitySegments,
        Map<String, Long> sourceMix,
        Map<String, Long> revenueByPlanType
    ) {
    }

    private record AiInsightResponse(
        String healthStatus,
        String overview,
        List<String> topRisks,
        List<String> revenueOpportunities,
        List<String> actionPlan7Days,
        List<String> trackingMetrics,
        String revenueRiskNote
    ) {
    }

    private record PtRisk(boolean unusedNearExpiry, boolean longInactive) {
    }

    private static final class MutableSegments {
        private final Map<String, MutableSegment> segments = new LinkedHashMap<>();

        void add(String code, String label, long revenueAtRisk) {
            segments.computeIfAbsent(code, ignored -> new MutableSegment(code, label))
                .add(revenueAtRisk);
        }

        List<AdvisorSegment> toResponses() {
            return segments.values().stream()
                .sorted(Comparator.comparingLong(MutableSegment::estimatedRevenueAtRisk).reversed())
                .map(MutableSegment::toResponse)
                .toList();
        }
    }

    private static final class MutableSegment {
        private static final Map<String, String> RECOMMENDATIONS = Map.ofEntries(
            Map.entry("OPEN_DEBT_ACTIVE_MEMBER", "Thu từng phần theo mức khách dễ thanh toán trước."),
            Map.entry("PT_NEAR_EXPIRY_UNUSED_SESSIONS", "Chốt lịch dồn buổi hoặc tư vấn gia hạn trước khi mất nhịp tập."),
            Map.entry("LONG_INACTIVE_PT_MEMBER", "Gọi xác nhận lý do gián đoạn và đặt lại buổi gần nhất."),
            Map.entry("FIRST_PACKAGE_NEAR_EXPIRY", "Chăm sóc sớm bằng gói 2 tháng/4 tháng để tăng tỷ lệ gia hạn."),
            Map.entry("DEBT_COLLECTION", "Ưu tiên khoản nhỏ và khoản có lịch tập đang diễn ra."),
            Map.entry("PT_RENEWAL_OR_SESSION_RECOVERY", "Đề xuất lịch cố định tuần tới và gói tiếp nối phù hợp.")
        );

        private final String code;
        private final String label;
        private long count;
        private long estimatedRevenueAtRisk;

        MutableSegment(String code, String label) {
            this.code = code;
            this.label = label;
        }

        void add(long revenueAtRisk) {
            this.count += 1;
            this.estimatedRevenueAtRisk += Math.max(0, revenueAtRisk);
        }

        long estimatedRevenueAtRisk() {
            return estimatedRevenueAtRisk;
        }

        AdvisorSegment toResponse() {
            return new AdvisorSegment(
                code,
                label,
                count,
                estimatedRevenueAtRisk,
                RECOMMENDATIONS.getOrDefault(code, "Chăm sóc thủ công và theo dõi lại trong tuần này.")
            );
        }
    }
}
