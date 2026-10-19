package com.gymduongdouble.backend.ai.service;

import com.gymduongdouble.backend.ai.client.GroqAiClient;
import com.gymduongdouble.backend.ai.config.GroqAiProperties;
import com.gymduongdouble.backend.ai.web.dto.RetentionRevenueAdvisorRequest;
import com.gymduongdouble.backend.ai.web.dto.RetentionRevenueAdvisorRequest.AdvisorScenarioRequest;
import com.gymduongdouble.backend.ai.web.dto.RetentionRevenueAdvisorResponse;
import com.gymduongdouble.backend.ai.web.dto.RetentionRevenueAdvisorResponse.AdvisorInsight;
import com.gymduongdouble.backend.ai.web.dto.RetentionRevenueAdvisorResponse.AdvisorSegment;
import com.gymduongdouble.backend.ai.web.dto.RetentionRevenueAdvisorResponse.AdvisorSummary;
import com.gymduongdouble.backend.ai.web.dto.RetentionRevenueAdvisorResponse.ScenarioInsight;
import com.gymduongdouble.backend.ai.web.dto.RetentionRevenueAdvisorResponse.ScenarioProjection;
import com.gymduongdouble.backend.common.enums.ActivityType;
import com.gymduongdouble.backend.common.enums.DebtStatus;
import com.gymduongdouble.backend.common.enums.MemberStatus;
import com.gymduongdouble.backend.common.enums.MembershipStatus;
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
import com.gymduongdouble.backend.membership.service.MembershipPeriodStatistics;
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
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RetentionRevenueAdvisorService {
    private static final int NEAR_EXPIRY_DAYS = 7;

    private static final String SCENARIO_PROMPT = """

        Payload có thể có trường scenario do hệ thống tự tính từ các tỷ lệ giả định của chủ phòng.
        Khi scenario có giá trị, thêm trường "scenario" vào JSON trả về:
        {
          "overview": "1-2 câu nhận xét kịch bản",
          "priorityActions": ["tối đa 3 hành động theo thứ tự ưu tiên"],
          "cautions": ["tối đa 2 lưu ý về giả định/rủi ro"]
        }
        Khi scenario là null, trả "scenario": null. Không tự tính lại hay khẳng định chắc chắn các giá trị do hệ thống đã tính.
        """;

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
    private final MembershipPeriodStatistics membershipPeriodStatistics;

    @Transactional(readOnly = true)
    public RetentionRevenueAdvisorResponse analyze(RetentionRevenueAdvisorRequest request) {
        YearMonth period = resolvePeriod(request);
        AdvisorPayload payload = buildPayload(period, request == null ? null : request.scenario());

        try {
            String prompt = payload.scenario() == null ? SYSTEM_PROMPT : SYSTEM_PROMPT + SCENARIO_PROMPT;
            AiInsightResponse aiInsight = groqAiClient.requestJson(prompt, payload, AiInsightResponse.class);
            return buildResponse(period, true, normalize(aiInsight, payload.scenario()), payload);
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

    private AdvisorPayload buildPayload(YearMonth period, AdvisorScenarioRequest scenarioRequest) {
        LocalDate today = AppClock.today();
        LocalDate monthStart = period.atDay(1);
        LocalDate monthEnd = period.atEndOfMonth();
        YearMonth previousPeriod = period.minusMonths(1);

        List<Member> members = memberRepository.findAll().stream()
            .filter(member -> member.getStatus() == MemberStatus.ACTIVE)
            .toList();
        List<MemberMembership> memberships = memberMembershipRepository.findAll().stream()
            .filter(membership -> membership.getStatus() != MembershipStatus.CANCELLED)
            .toList();
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
        Set<Long> highRiskMemberIds = new LinkedHashSet<>();
        Set<Long> mediumRiskMemberIds = new LinkedHashSet<>();
        Map<Long, Long> renewalOpportunityByMember = new LinkedHashMap<>();
        Map<Long, Long> ptRecoveryOpportunityByMember = new LinkedHashMap<>();

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
                    mediumRiskMemberIds.add(member.getId());
                    markRenewalOpportunity(renewalOpportunityByMember, member, value);
                    riskSegments.add(segmentCode(planType, "NEAR_EXPIRY"), segmentLabel(planType, "sắp hết hạn"), value);
                    opportunitySegments.add(segmentCode(planType, "RENEWAL_WINDOW"), segmentLabel(planType, "đang trong cửa sổ gia hạn"), value);
                }

                if (hasOpenDebt) {
                    mediumRiskMemberIds.add(member.getId());
                    riskSegments.add("OPEN_DEBT_ACTIVE_MEMBER", "Khách đang tập nhưng còn công nợ", memberDebt);
                    opportunitySegments.add("DEBT_COLLECTION", "Công nợ có thể thu hồi", memberDebt);
                }

                if (memberMemberships.size() == 1 && daysToEnd <= 14) {
                    riskSegments.add("FIRST_PACKAGE_NEAR_EXPIRY", "Khách mới mua gói đầu tiên sắp hết hạn", value);
                }

                if (planType == PlanType.PT) {
                    PtRisk ptRisk = analyzePtRisk(ptPackagesByMember.getOrDefault(member.getId(), List.of()), latestActivityByMember.get(member.getId()), today);
                    if (ptRisk.unusedNearExpiry()) {
                        highRiskMemberIds.add(member.getId());
                        markRenewalOpportunity(renewalOpportunityByMember, member, value);
                        riskSegments.add("PT_NEAR_EXPIRY_UNUSED_SESSIONS", "Khách PT gần hết hạn nhưng còn nhiều buổi", value);
                        opportunitySegments.add("PT_RENEWAL_OR_SESSION_RECOVERY", "Khôi phục lịch PT hoặc gia hạn PT", value);
                    }
                    if (ptRisk.longInactive()) {
                        mediumRiskMemberIds.add(member.getId());
                        riskSegments.add("LONG_INACTIVE_PT_MEMBER", "Khách PT gián đoạn lịch tập lâu ngày", value);
                    }
                    if (ptRisk.unusedNearExpiry() || ptRisk.longInactive()) {
                        markRenewalOpportunity(ptRecoveryOpportunityByMember, member, value);
                    }
                }
            } else if (preferredMembership.isPresent() && preferredMembership.get().getEndDate().isBefore(today)) {
                expiredMembers += 1;
                MemberMembership membership = preferredMembership.get();
                long value = money(membership.getActualPrice());
                long expiredDays = ChronoUnit.DAYS.between(membership.getEndDate(), today);

                if (expiredDays > 7) {
                    highRiskMemberIds.add(member.getId());
                } else {
                    mediumRiskMemberIds.add(member.getId());
                }
                markRenewalOpportunity(renewalOpportunityByMember, member, value);
                riskSegments.add(segmentCode(membership.getPlan().getPlanType(), expiredDays > 7 ? "EXPIRED_OVER_7_DAYS" : "EXPIRED_RECENTLY"), segmentLabel(membership.getPlan().getPlanType(), expiredDays > 7 ? "đã hết hạn hơn 7 ngày" : "vừa hết hạn"), value);
                opportunitySegments.add(segmentCode(membership.getPlan().getPlanType(), "WINBACK"), segmentLabel(membership.getPlan().getPlanType(), "có thể chăm sóc quay lại"), value);
            }
        }

        mediumRiskMemberIds.removeAll(highRiskMemberIds);
        long currentRevenue = currentPayments.stream().map(Payment::getAmount).mapToLong(this::money).sum();
        long previousRevenue = previousPayments.stream().map(Payment::getAmount).mapToLong(this::money).sum();
        long openDebtAmount = activeDebts.stream().map(DebtRecord::getRemainingAmount).mapToLong(this::money).sum();
        long renewalOpportunityValue = renewalOpportunityByMember.values().stream().mapToLong(Long::longValue).sum();
        Map<Long, Long> renewalScenarioOpportunityByMember = new LinkedHashMap<>(renewalOpportunityByMember);
        ptRecoveryOpportunityByMember.keySet().forEach(renewalScenarioOpportunityByMember::remove);
        long ptRecoveryPotential = ptRecoveryOpportunityByMember.values().stream().mapToLong(Long::longValue).sum();
        long renewalOpportunityPotential = renewalScenarioOpportunityByMember.values().stream().mapToLong(Long::longValue).sum();
        MembershipPeriodStatistics.Counts periodCounts = membershipPeriodStatistics.count(memberships, monthStart, monthEnd);
        ScenarioProjection scenario = scenarioRequest == null ? null : RetentionRevenueScenarioCalculator.calculate(
            scenarioRequest,
            openDebtAmount,
            ptRecoveryPotential,
            renewalOpportunityPotential
        );

        AdvisorSummary summary = new AdvisorSummary(
            members.size(),
            activeMembers,
            expiredMembers,
            nearExpiryMembers,
            highRiskMemberIds.size(),
            mediumRiskMemberIds.size(),
            activeDebts.size(),
            periodCounts.newMembers(),
            periodCounts.renewedMembers(),
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
            revenueByPlanType,
            scenario
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
            payload.scenario(),
            insight
        );
    }

    private AdvisorInsight normalize(AiInsightResponse response, ScenarioProjection scenario) {
        return new AdvisorInsight(
            normalizeHealthStatus(response.healthStatus()),
            safeText(response.overview(), "AI đã phân tích dữ liệu tổng hợp và đưa ra khuyến nghị vận hành."),
            safeList(response.topRisks()),
            safeList(response.revenueOpportunities()),
            safeList(response.actionPlan7Days()),
            safeList(response.trackingMetrics()),
            safeText(response.revenueRiskNote(), "Theo dõi nhóm hết hạn, công nợ và PT còn buổi để giảm giá trị rủi ro."),
            normalizeScenarioInsight(response.scenario(), scenario),
            null
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
            fallbackScenarioInsight(payload.scenario()),
            providerMessage
        );
    }

    private ScenarioInsight normalizeScenarioInsight(AiScenarioResponse response, ScenarioProjection scenario) {
        if (scenario == null) {
            return null;
        }
        ScenarioInsight fallback = fallbackScenarioInsight(scenario);
        if (response == null) {
            return fallback;
        }
        List<String> priorityActions = safeList(response.priorityActions()).stream().limit(3).toList();
        List<String> cautions = safeList(response.cautions()).stream().limit(2).toList();
        return new ScenarioInsight(
            safeText(response.overview(), fallback.overview()),
            priorityActions.isEmpty() ? fallback.priorityActions() : priorityActions,
            cautions.isEmpty() ? fallback.cautions() : cautions
        );
    }

    private ScenarioInsight fallbackScenarioInsight(ScenarioProjection scenario) {
        if (scenario == null) {
            return null;
        }

        List<ScenarioAction> actions = new ArrayList<>(List.of(
            new ScenarioAction(
                "Thu công nợ theo mức " + scenario.debtCollectionPercent() + "%: khoảng "
                    + scenario.estimatedDebtCollection() + " VND.",
                scenario.estimatedDebtCollection()
            ),
            new ScenarioAction(
                "Khôi phục/giữ chân nhóm PT rủi ro theo mức " + scenario.ptRecoveryPercent() + "%: khoảng "
                    + scenario.estimatedPtRecoveryValue() + " VND.",
                scenario.estimatedPtRecoveryValue()
            ),
            new ScenarioAction(
                "Gia hạn/quay lại nhóm còn lại theo mức " + scenario.renewalConversionPercent() + "%: khoảng "
                    + scenario.estimatedRenewalValue() + " VND.",
                scenario.estimatedRenewalValue()
            )
        ));
        List<String> priorityActions = actions.stream()
            .sorted(Comparator.comparingLong(ScenarioAction::value).reversed())
            .map(ScenarioAction::label)
            .limit(3)
            .toList();

        return new ScenarioInsight(
            "Theo các tỷ lệ đã chọn, kịch bản có giá trị tối đa có thể tác động khoảng "
                + scenario.estimatedTotalImpact() + " VND.",
            priorityActions,
            List.of(
                "Đây là mô phỏng theo giả định, không phải doanh thu đã thu hoặc được bảo đảm.",
                "Phân tích không tạo phiếu thu, đổi trạng thái gói hay tự động liên hệ hội viên."
            )
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

    private String normalizeHealthStatus(String value) {
        String normalized = safeText(value, "WATCH").toUpperCase();
        return switch (normalized) {
            case "GOOD", "WATCH", "RISK" -> normalized;
            default -> "WATCH";
        };
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
        Map<String, Long> revenueByPlanType,
        ScenarioProjection scenario
    ) {
    }

    private record AiInsightResponse(
        String healthStatus,
        String overview,
        List<String> topRisks,
        List<String> revenueOpportunities,
        List<String> actionPlan7Days,
        List<String> trackingMetrics,
        String revenueRiskNote,
        AiScenarioResponse scenario
    ) {
    }

    private record AiScenarioResponse(
        String overview,
        List<String> priorityActions,
        List<String> cautions
    ) {
    }

    private record PtRisk(boolean unusedNearExpiry, boolean longInactive) {
    }

    private record ScenarioAction(String label, long value) {
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
