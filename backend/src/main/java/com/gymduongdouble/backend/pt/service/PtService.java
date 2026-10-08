package com.gymduongdouble.backend.pt.service;

import com.gymduongdouble.backend.common.enums.ActivityType;
import com.gymduongdouble.backend.common.enums.MembershipStatus;
import com.gymduongdouble.backend.common.enums.PlanType;
import com.gymduongdouble.backend.common.enums.ProgramStatus;
import com.gymduongdouble.backend.common.enums.PtAssignmentStatus;
import com.gymduongdouble.backend.common.enums.PtSessionStatus;
import com.gymduongdouble.backend.common.enums.ScheduleStatus;
import com.gymduongdouble.backend.common.enums.SessionPackageStatus;
import com.gymduongdouble.backend.common.exception.BadRequestException;
import com.gymduongdouble.backend.common.exception.ResourceNotFoundException;
import com.gymduongdouble.backend.common.security.AuthenticatedUser;
import com.gymduongdouble.backend.common.security.SecurityUtils;
import com.gymduongdouble.backend.member.domain.Member;
import com.gymduongdouble.backend.member.service.MemberService;
import com.gymduongdouble.backend.member.web.dto.MemberResponse;
import com.gymduongdouble.backend.membership.domain.MemberMembership;
import com.gymduongdouble.backend.membership.repository.MemberMembershipRepository;
import com.gymduongdouble.backend.pt.domain.MemberActivityLog;
import com.gymduongdouble.backend.pt.domain.PtAssignment;
import com.gymduongdouble.backend.pt.domain.PtProfile;
import com.gymduongdouble.backend.pt.domain.PtSchedule;
import com.gymduongdouble.backend.pt.domain.PtSessionLog;
import com.gymduongdouble.backend.pt.domain.PtSessionPackage;
import com.gymduongdouble.backend.pt.repository.MemberActivityLogRepository;
import com.gymduongdouble.backend.pt.repository.PtAssignmentRepository;
import com.gymduongdouble.backend.pt.repository.PtProfileRepository;
import com.gymduongdouble.backend.pt.repository.PtScheduleRepository;
import com.gymduongdouble.backend.pt.repository.PtSessionLogRepository;
import com.gymduongdouble.backend.pt.repository.PtSessionPackageRepository;
import com.gymduongdouble.backend.pt.web.dto.BodyMeasurementRequest;
import com.gymduongdouble.backend.pt.web.dto.BodyMeasurementResponse;
import com.gymduongdouble.backend.pt.web.dto.MemberActivityLogRequest;
import com.gymduongdouble.backend.pt.web.dto.MemberActivityLogResponse;
import com.gymduongdouble.backend.pt.web.dto.PtAssignmentRequest;
import com.gymduongdouble.backend.pt.web.dto.PtAssignmentResponse;
import com.gymduongdouble.backend.pt.web.dto.PtGoalRequest;
import com.gymduongdouble.backend.pt.web.dto.PtGoalResponse;
import com.gymduongdouble.backend.pt.web.dto.PtMemberDetailResponse;
import com.gymduongdouble.backend.pt.web.dto.PtProfileRequest;
import com.gymduongdouble.backend.pt.web.dto.PtProfileResponse;
import com.gymduongdouble.backend.pt.web.dto.PtScheduleRequest;
import com.gymduongdouble.backend.pt.web.dto.PtScheduleResponse;
import com.gymduongdouble.backend.pt.web.dto.PtSessionLogRequest;
import com.gymduongdouble.backend.pt.web.dto.PtSessionLogResponse;
import com.gymduongdouble.backend.pt.web.dto.PtSessionPackageSummaryResponse;
import com.gymduongdouble.backend.training.domain.BodyMeasurement;
import com.gymduongdouble.backend.training.domain.PtGoal;
import com.gymduongdouble.backend.training.repository.BodyMeasurementRepository;
import com.gymduongdouble.backend.training.repository.PtGoalRepository;
import com.gymduongdouble.backend.user.domain.User;
import com.gymduongdouble.backend.user.repository.UserRepository;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PtService {

    private static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final PtProfileRepository ptProfileRepository;
    private final PtAssignmentRepository ptAssignmentRepository;
    private final PtScheduleRepository ptScheduleRepository;
    private final PtSessionPackageRepository ptSessionPackageRepository;
    private final PtSessionLogRepository ptSessionLogRepository;
    private final MemberActivityLogRepository memberActivityLogRepository;
    private final BodyMeasurementRepository bodyMeasurementRepository;
    private final PtGoalRepository ptGoalRepository;
    private final UserRepository userRepository;
    private final MemberService memberService;
    private final MemberMembershipRepository memberMembershipRepository;

    @Transactional(readOnly = true)
    public List<PtProfileResponse> listProfiles() {
        return ptProfileRepository.findAll().stream()
            .filter(profile -> profile.getUser().getRoles().stream()
                .anyMatch(role -> role.getCode().equals("PT")))
            .sorted(Comparator.comparing(profile -> profile.getUser().getFullName()))
            .map(PtProfileResponse::from)
            .toList();
    }

    @Transactional
    public PtProfileResponse saveProfile(PtProfileRequest request) {
        User user = findUser(request.userId());
        ensureCanManagePtUser(user.getId());
        ensureUserHasRole(user, "PT", "Chỉ tài khoản PT mới được tạo hồ sơ huấn luyện viên.");
        PtProfile profile = ptProfileRepository.findByUserId(user.getId()).orElseGet(PtProfile::new);
        profile.setUser(user);
        profile.setPtLevel(request.ptLevel());
        profile.setSpecialty(request.specialty());
        profile.setBio(request.bio());
        if (request.baseSalary() != null) {
            profile.setBaseSalary(request.baseSalary());
        }
        if (request.teachingRate() != null) {
            profile.setTeachingRate(request.teachingRate());
        }
        if (request.salesCommissionRate() != null) {
            profile.setSalesCommissionRate(request.salesCommissionRate());
        }
        profile.setActive(request.active() == null || request.active());
        return PtProfileResponse.from(ptProfileRepository.save(profile));
    }

    @Transactional
    public PtAssignmentResponse assignMember(PtAssignmentRequest request) {
        User ptUser = findUser(request.ptUserId());
        ensureUserHasRole(ptUser, "PT", "Người phụ trách phải là tài khoản PT.");
        ensureCanManagePtUser(ptUser.getId());
        Member member = memberService.findEntity(request.memberId());
        ensureMemberHasAssignablePtPackage(member.getId());
        ensureMemberHasNoActivePtAssignment(member.getId(), request.startDate());

        PtAssignment assignment = new PtAssignment();
        assignment.setPtUser(ptUser);
        assignment.setMember(member);
        assignment.setStartDate(request.startDate());
        assignment.setEndDate(request.endDate());
        assignment.setStatus(PtAssignmentStatus.ACTIVE);
        assignment.setNote(request.note());

        activePtPackages(member.getId()).forEach(sessionPackage -> sessionPackage.setPtUser(ptUser));

        return PtAssignmentResponse.from(ptAssignmentRepository.save(assignment));
    }

    @Transactional(readOnly = true)
    public List<PtAssignmentResponse> listMyMembers(Long ptUserId) {
        Long resolvedPtUserId = resolveVisiblePtUserId(ptUserId);
        List<PtAssignment> assignments = resolvedPtUserId == null
            ? ptAssignmentRepository.findAll()
            : ptAssignmentRepository.findByPtUserId(resolvedPtUserId);

        return assignments.stream()
            .filter(assignment -> assignment.getStatus() == PtAssignmentStatus.ACTIVE)
            .sorted(Comparator.comparing(assignment -> assignment.getMember().getFullName()))
            .map(PtAssignmentResponse::from)
            .toList();
    }

    @Transactional
    public PtScheduleResponse createSchedule(PtScheduleRequest request) {
        User ptUser = findUser(request.ptUserId());
        ensureUserHasRole(ptUser, "PT", "Lịch dạy phải gắn với tài khoản PT.");
        Member member = request.memberId() == null ? null : memberService.findEntity(request.memberId());
        ensureCanManagePtUser(ptUser.getId());
        if (member != null) {
            ensureCanAccessMember(member.getId());
        }

        LocalDate today = LocalDate.now(VIETNAM_ZONE);
        if (request.scheduleDate().isBefore(today)) {
            throw new BadRequestException("Không thể đặt lịch dạy cho ngày trong quá khứ (" + request.scheduleDate() + ").");
        }
        if (request.scheduleDate().isEqual(today)) {
            LocalTime now = LocalTime.now(VIETNAM_ZONE);
            LocalTime nowMinusGrace = now.minusMinutes(2);
            if (request.startTime().isBefore(nowMinusGrace)) {
                String currentTimeStr = now.format(DateTimeFormatter.ofPattern("HH:mm"));
                throw new BadRequestException("Không thể đặt lịch dạy trong quá khứ (" + request.startTime() + "). Hiện tại là " + currentTimeStr + ", vui lòng chọn khung giờ hợp lệ.");
            }
        }
        if (request.endTime() != null && !request.endTime().isAfter(request.startTime())) {
            throw new BadRequestException("Giờ kết thúc phải sau giờ bắt đầu.");
        }

        PtSchedule schedule = new PtSchedule();
        schedule.setPtUser(ptUser);
        schedule.setMember(member);
        schedule.setScheduleDate(request.scheduleDate());
        schedule.setStartTime(request.startTime());
        schedule.setEndTime(request.endTime());
        schedule.setStatus(request.status() == null ? ScheduleStatus.SCHEDULED : request.status());
        schedule.setNote(request.note());
        schedule.setCreatedBy(currentUserEntityOrNull());
        return PtScheduleResponse.from(ptScheduleRepository.save(schedule));
    }

    @Transactional
    public void deleteSchedule(Long scheduleId) {
        PtSchedule schedule = findSchedule(scheduleId);
        ensureCanManagePtUser(schedule.getPtUser().getId());
        if (schedule.getMember() != null) {
            ensureCanAccessMember(schedule.getMember().getId());
        }
        if (ptSessionLogRepository.existsByScheduleId(scheduleId)) {
            throw new BadRequestException("Không thể xoá lịch dạy này vì buổi tập đã được ghi nhận trong lịch sử.");
        }
        ptScheduleRepository.delete(schedule);
    }

    @Transactional(readOnly = true)
    public List<PtScheduleResponse> listSchedules(Long ptUserId, LocalDate fromDate, LocalDate toDate) {
        LocalDate start = fromDate == null ? LocalDate.now() : fromDate;
        LocalDate end = toDate == null ? start.plusDays(7) : toDate;
        Long resolvedPtUserId = resolveVisiblePtUserId(ptUserId);

        List<PtSchedule> schedules = resolvedPtUserId == null
            ? ptScheduleRepository.findByScheduleDateBetween(start, end)
            : ptScheduleRepository.findByPtUserIdAndScheduleDateBetween(resolvedPtUserId, start, end);

        return schedules.stream()
            .sorted(Comparator.comparing(PtSchedule::getScheduleDate).thenComparing(PtSchedule::getStartTime))
            .map(PtScheduleResponse::from)
            .toList();
    }

    @Transactional(readOnly = true)
    public PtMemberDetailResponse getMemberDetail(Long memberId) {
        ensureCanAccessMember(memberId);
        Member member = memberService.findEntity(memberId);
        return new PtMemberDetailResponse(
            MemberResponse.from(member),
            ptAssignmentRepository.findByMemberId(memberId).stream().map(PtAssignmentResponse::from).toList(),
            listSessionPackageEntities(memberId).stream().map(PtSessionPackageSummaryResponse::from).toList(),
            ptScheduleRepository.findByMemberIdOrderByScheduleDateDesc(memberId).stream().map(PtScheduleResponse::from).toList(),
            ptSessionLogRepository.findByMemberIdOrderBySessionDateDesc(memberId).stream().map(PtSessionLogResponse::from).toList(),
            memberActivityLogRepository.findByMemberIdOrderByActivityDateDesc(memberId).stream().map(MemberActivityLogResponse::from).toList(),
            bodyMeasurementRepository.findByMemberIdOrderByRecordedAtDesc(memberId).stream().map(BodyMeasurementResponse::from).toList(),
            ptGoalRepository.findByMemberIdOrderByCreatedAtDesc(memberId).stream().map(PtGoalResponse::from).toList()
        );
    }

    @Transactional(readOnly = true)
    public List<PtSessionPackageSummaryResponse> listSessionPackages(Long memberId) {
        if (memberId != null) {
            ensureCanAccessMember(memberId);
        } else if (!isOwner()) {
            throw new AccessDeniedException("PT chỉ được xem gói buổi của khách được phân công.");
        }
        return listSessionPackageEntities(memberId).stream()
            .map(PtSessionPackageSummaryResponse::from)
            .toList();
    }

    @Transactional
    public PtSessionLogResponse createSessionLog(Long memberId, PtSessionLogRequest request) {
        ensureCanAccessMember(memberId);
        PtSessionPackage sessionPackage = findSessionPackage(request.sessionPackageId());
        if (!sessionPackage.getMember().getId().equals(memberId)) {
            throw new BadRequestException("Gói buổi PT không thuộc khách hàng này.");
        }
        ensureUsableSessionPackage(sessionPackage, request.sessionDate(), true);
        PtSchedule schedule = request.scheduleId() == null ? null : findSchedule(request.scheduleId());
        if (schedule != null) {
            ensureScheduleCanBeLogged(schedule, sessionPackage, memberId, request.sessionDate());
        }
        User ptUser = schedule != null
            ? schedule.getPtUser()
            : sessionPackage.getPtUser() == null ? currentPtUserOrNull() : sessionPackage.getPtUser();

        PtSessionLog log = new PtSessionLog();
        log.setSessionPackage(sessionPackage);
        log.setMember(sessionPackage.getMember());
        log.setPtUser(ptUser);
        log.setSchedule(schedule);
        log.setSessionDate(request.sessionDate());
        log.setSessionNumber(request.sessionNumber());
        log.setWeight(request.weight());
        log.setStatus(request.status() == null ? PtSessionStatus.COMPLETED : request.status());
        log.setContent(request.content());
        log.setNote(request.note());
        log.setCreatedBy(currentUserEntityOrNull());

        if (shouldConsumePtSession(log.getStatus())) {
            usePtSession(sessionPackage);
        }
        if (schedule != null) {
            schedule.setStatus(scheduleStatusFor(log.getStatus()));
        }

        return PtSessionLogResponse.from(ptSessionLogRepository.save(log));
    }

    @Transactional
    public MemberActivityLogResponse createActivityLog(Long memberId, MemberActivityLogRequest request) {
        ensureCanAccessMember(memberId);
        Member member = memberService.findEntity(memberId);
        MemberMembership membership = request.membershipId() == null ? null : findMembership(request.membershipId());
        PtSessionPackage sessionPackage = request.sessionPackageId() == null ? null : findSessionPackage(request.sessionPackageId());

        if (membership != null && !membership.getMember().getId().equals(memberId)) {
            throw new BadRequestException("Lượt đăng ký gói không thuộc khách hàng này.");
        }
        if (sessionPackage != null && !sessionPackage.getMember().getId().equals(memberId)) {
            throw new BadRequestException("Gói buổi PT không thuộc khách hàng này.");
        }
        if (request.activityType() == ActivityType.PRACTICE && sessionPackage == null) {
            throw new BadRequestException("Buổi ôn tập cần chọn gói buổi PT.");
        }
        if (request.activityType() == ActivityType.PRACTICE) {
            ensureUsableSessionPackage(sessionPackage, request.activityDate(), false);
            usePracticeSession(sessionPackage);
        }
        if (request.activityType() == ActivityType.GUIDANCE_CHECKIN) {
            ensureGuidanceMembershipCanBeLogged(membership, memberId, request.activityDate());
        }

        MemberActivityLog log = new MemberActivityLog();
        log.setMember(member);
        log.setMembership(membership);
        log.setSessionPackage(sessionPackage);
        log.setActivityType(request.activityType());
        log.setActivityDate(request.activityDate());
        log.setSessionNumber(request.sessionNumber());
        log.setWeight(request.weight());
        log.setNote(request.note());
        log.setCreatedBy(currentUserEntityOrNull());
        return MemberActivityLogResponse.from(memberActivityLogRepository.save(log));
    }

    @Transactional
    public BodyMeasurementResponse createBodyMeasurement(Long memberId, BodyMeasurementRequest request) {
        ensureCanAccessMember(memberId);
        Member member = memberService.findEntity(memberId);

        BodyMeasurement measurement = new BodyMeasurement();
        measurement.setMember(member);
        measurement.setRecordedBy(currentUserEntityOrNull());
        measurement.setRecordedAt(request.recordedAt().atStartOfDay(VIETNAM_ZONE).toInstant());
        measurement.setHeight(request.height());
        measurement.setWeight(request.weight());
        measurement.setChest(request.chest());
        measurement.setWaist(request.waist());
        measurement.setAbdomen(request.abdomen());
        measurement.setHip(request.hip());
        measurement.setThigh(request.thigh());
        measurement.setArm(request.arm());
        measurement.setNote(request.note());
        return BodyMeasurementResponse.from(bodyMeasurementRepository.save(measurement));
    }

    @Transactional
    public PtGoalResponse createGoal(Long memberId, PtGoalRequest request) {
        ensureCanAccessMember(memberId);
        Member member = memberService.findEntity(memberId);
        User ptUser = request.ptUserId() == null ? currentPtUserOrNull() : findUser(request.ptUserId());
        if (ptUser != null) {
            ensureUserHasRole(ptUser, "PT", "Mục tiêu PT phải gắn với tài khoản PT.");
            ensureCanManagePtUser(ptUser.getId());
        }

        PtGoal goal = new PtGoal();
        goal.setMember(member);
        goal.setPtUser(ptUser);
        goal.setGoalType(request.goalType());
        goal.setGoalDescription(request.goalDescription());
        goal.setStartDate(request.startDate());
        goal.setTargetDate(request.targetDate());
        goal.setTargetWeight(request.targetWeight());
        goal.setTargetBodyFat(request.targetBodyFat());
        goal.setTargetWaist(request.targetWaist());
        goal.setStatus(ProgramStatus.ACTIVE);
        goal.setNote(request.note());
        return PtGoalResponse.from(ptGoalRepository.save(goal));
    }

    private void ensureMemberHasAssignablePtPackage(Long memberId) {
        if (activePtPackages(memberId).isEmpty()) {
            throw new BadRequestException("Chỉ có thể gán PT cho khách đang có gói PT còn hiệu lực.");
        }
    }

    private void ensureMemberHasNoActivePtAssignment(Long memberId, LocalDate newStartDate) {
        boolean hasActiveAssignment = ptAssignmentRepository.findByMemberId(memberId).stream()
            .anyMatch(assignment -> assignment.getStatus() == PtAssignmentStatus.ACTIVE
                && (assignment.getEndDate() == null || !assignment.getEndDate().isBefore(newStartDate)));
        if (hasActiveAssignment) {
            throw new BadRequestException("Khách này đã có PT phụ trách. Vui lòng kết thúc phân công cũ trước khi gán PT mới.");
        }
    }

    private List<PtSessionPackage> activePtPackages(Long memberId) {
        LocalDate today = LocalDate.now(VIETNAM_ZONE);
        return ptSessionPackageRepository.findByMemberIdOrderByStartDateDesc(memberId).stream()
            .filter(sessionPackage -> sessionPackage.getStatus() == SessionPackageStatus.ACTIVE)
            .filter(sessionPackage -> sessionPackage.getMembership().getStatus() != MembershipStatus.CANCELLED)
            .filter(sessionPackage -> sessionPackage.getMembership().getPlan().getPlanType() == PlanType.PT)
            .filter(sessionPackage -> !sessionPackage.getEndDate().isBefore(today))
            .filter(sessionPackage -> sessionPackage.getRemainingPtSessions() > 0 || sessionPackage.getRemainingPracticeSessions() > 0)
            .toList();
    }

    private void ensureScheduleCanBeLogged(PtSchedule schedule, PtSessionPackage sessionPackage, Long memberId, LocalDate sessionDate) {
        if (schedule.getMember() == null || !schedule.getMember().getId().equals(memberId)) {
            throw new BadRequestException("Lịch PT không thuộc khách hàng này.");
        }
        if (sessionDate != null && !schedule.getScheduleDate().equals(sessionDate)) {
            throw new BadRequestException("Ngày ghi buổi không khớp với lịch PT đã chọn.");
        }
        if (sessionPackage.getPtUser() != null && !schedule.getPtUser().getId().equals(sessionPackage.getPtUser().getId())) {
            throw new BadRequestException("Lịch PT không thuộc PT đang phụ trách gói này.");
        }
        if (ptSessionLogRepository.existsByScheduleId(schedule.getId())) {
            throw new BadRequestException("Lịch PT này đã được ghi nhận buổi tập.");
        }
    }

    private boolean shouldConsumePtSession(PtSessionStatus status) {
        return status == PtSessionStatus.COMPLETED || status == PtSessionStatus.MISSED;
    }

    private ScheduleStatus scheduleStatusFor(PtSessionStatus status) {
        return switch (status) {
            case COMPLETED -> ScheduleStatus.COMPLETED;
            case MISSED -> ScheduleStatus.MISSED;
            case CANCELLED -> ScheduleStatus.CANCELLED;
            case RESCHEDULED -> ScheduleStatus.RESCHEDULED;
        };
    }

    private void ensureUsableSessionPackage(PtSessionPackage sessionPackage, LocalDate activityDate, boolean requirePtSession) {
        if (sessionPackage.getStatus() != SessionPackageStatus.ACTIVE) {
            throw new BadRequestException("Gói PT không còn hoạt động.");
        }
        if (sessionPackage.getMembership().getStatus() == MembershipStatus.CANCELLED) {
            throw new BadRequestException("Lượt đăng ký gói PT đã bị hủy.");
        }
        if (sessionPackage.getEndDate().isBefore(activityDate)) {
            throw new BadRequestException("Gói PT đã hết hạn sử dụng.");
        }
        if (requirePtSession && sessionPackage.getRemainingPtSessions() <= 0) {
            throw new BadRequestException("Gói PT không còn buổi PT để check-in.");
        }
    }

    private void ensureGuidanceMembershipCanBeLogged(MemberMembership membership, Long memberId, LocalDate activityDate) {
        if (membership == null) {
            throw new BadRequestException("Buổi hướng dẫn/trị liệu cần chọn gói Cổ Vai Gáy/Hướng dẫn.");
        }
        if (!membership.getMember().getId().equals(memberId)) {
            throw new BadRequestException("Lượt đăng ký gói không thuộc khách hàng này.");
        }
        if (membership.getPlan().getPlanType() != PlanType.GUIDANCE) {
            throw new BadRequestException("Chỉ gói hướng dẫn/trị liệu mới được ghi buổi hướng dẫn.");
        }
        if (membership.getStatus() == MembershipStatus.CANCELLED || membership.getEndDate().isBefore(activityDate)) {
            throw new BadRequestException("Gói hướng dẫn/trị liệu đã hết hiệu lực.");
        }
        Integer totalGuidanceSessions = membership.getPlan().getGuidanceSessionCount();
        if (totalGuidanceSessions != null && totalGuidanceSessions > 0) {
            long used = memberActivityLogRepository.countByMembershipIdAndActivityType(membership.getId(), ActivityType.GUIDANCE_CHECKIN);
            if (used >= totalGuidanceSessions) {
                throw new BadRequestException("Gói hướng dẫn/trị liệu đã dùng hết số buổi.");
            }
        }
    }

    private List<PtSessionPackage> listSessionPackageEntities(Long memberId) {
        if (memberId == null) {
            return ptSessionPackageRepository.findAll().stream()
                .sorted(Comparator.comparing(PtSessionPackage::getStartDate).reversed())
                .toList();
        }
        return ptSessionPackageRepository.findByMemberIdOrderByStartDateDesc(memberId);
    }

    private void usePtSession(PtSessionPackage sessionPackage) {
        if (sessionPackage.getRemainingPtSessions() <= 0) {
            throw new BadRequestException("Gói PT không còn buổi PT để check-in.");
        }
        sessionPackage.setUsedPtSessions(sessionPackage.getUsedPtSessions() + 1);
        sessionPackage.setRemainingPtSessions(sessionPackage.getRemainingPtSessions() - 1);
        completePackageIfNeeded(sessionPackage);
    }

    private void usePracticeSession(PtSessionPackage sessionPackage) {
        if (sessionPackage.getRemainingPracticeSessions() <= 0) {
            throw new BadRequestException("Gói PT không còn buổi ôn tập để check-in.");
        }
        sessionPackage.setUsedPracticeSessions(sessionPackage.getUsedPracticeSessions() + 1);
        sessionPackage.setRemainingPracticeSessions(sessionPackage.getRemainingPracticeSessions() - 1);
        completePackageIfNeeded(sessionPackage);
    }

    private void completePackageIfNeeded(PtSessionPackage sessionPackage) {
        if (sessionPackage.getRemainingPtSessions() <= 0 && sessionPackage.getRemainingPracticeSessions() <= 0) {
            sessionPackage.setStatus(SessionPackageStatus.COMPLETED);
        }
    }

    private Long resolveVisiblePtUserId(Long requestedPtUserId) {
        if (isOwner()) {
            return requestedPtUserId;
        }
        Long currentUserId = currentUserId();
        if (requestedPtUserId != null && !requestedPtUserId.equals(currentUserId)) {
            throw new AccessDeniedException("PT chỉ được xem dữ liệu của chính mình.");
        }
        return currentUserId;
    }

    private void ensureCanManagePtUser(Long ptUserId) {
        if (isOwner()) {
            return;
        }
        if (!ptUserId.equals(currentUserId())) {
            throw new AccessDeniedException("PT chỉ được thao tác lịch của chính mình.");
        }
    }

    private void ensureUserHasRole(User user, String roleCode, String message) {
        boolean hasRole = user.getRoles().stream().anyMatch(role -> roleCode.equals(role.getCode()));
        if (!hasRole) {
            throw new BadRequestException(message);
        }
    }

    private void ensureCanAccessMember(Long memberId) {
        if (isOwner()) {
            return;
        }
        Long currentUserId = currentUserId();
        boolean assigned = ptAssignmentRepository.findByMemberId(memberId).stream()
            .anyMatch(assignment -> assignment.getStatus() == PtAssignmentStatus.ACTIVE
                && assignment.getPtUser().getId().equals(currentUserId));
        if (!assigned) {
            throw new AccessDeniedException("PT chỉ được xem khách được phân công.");
        }
    }

    private boolean isOwner() {
        return SecurityUtils.currentUser()
            .stream()
            .map(AuthenticatedUser::getAuthorities)
            .flatMap(authorities -> authorities.stream())
            .anyMatch(authority -> authority.getAuthority().equals("ROLE_OWNER"));
    }

    private Long currentUserId() {
        Long userId = SecurityUtils.currentUserIdOrNull();
        if (userId == null) {
            throw new AccessDeniedException("Bạn cần đăng nhập để thực hiện thao tác này.");
        }
        return userId;
    }

    private User currentUserEntityOrNull() {
        Long userId = SecurityUtils.currentUserIdOrNull();
        return userId == null ? null : userRepository.findById(userId).orElse(null);
    }

    private User currentPtUserOrNull() {
        User user = currentUserEntityOrNull();
        if (user == null || user.getRoles().stream().noneMatch(role -> "PT".equals(role.getCode()))) {
            return null;
        }
        return user;
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy user."));
    }

    private PtSessionPackage findSessionPackage(Long id) {
        return ptSessionPackageRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy gói buổi PT."));
    }

    private PtSchedule findSchedule(Long id) {
        return ptScheduleRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch dạy PT."));
    }

    private MemberMembership findMembership(Long id) {
        return memberMembershipRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lượt đăng ký gói."));
    }
}
