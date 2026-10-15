package com.gymduongdouble.backend.pt.service;

import com.gymduongdouble.backend.common.enums.ActivityType;
import com.gymduongdouble.backend.common.enums.MemberStatus;
import com.gymduongdouble.backend.common.enums.PlanType;
import com.gymduongdouble.backend.common.enums.ProgramStatus;
import com.gymduongdouble.backend.common.enums.PtAssignmentStatus;
import com.gymduongdouble.backend.common.enums.PtSessionStatus;
import com.gymduongdouble.backend.common.enums.ScheduleStatus;
import com.gymduongdouble.backend.common.enums.SessionPackageStatus;
import com.gymduongdouble.backend.common.enums.UserStatus;
import com.gymduongdouble.backend.common.exception.BadRequestException;
import com.gymduongdouble.backend.common.exception.ResourceNotFoundException;
import com.gymduongdouble.backend.common.security.AuthenticatedUser;
import com.gymduongdouble.backend.common.security.SecurityUtils;
import com.gymduongdouble.backend.common.time.AppClock;
import com.gymduongdouble.backend.member.domain.Member;
import com.gymduongdouble.backend.member.service.MemberService;
import com.gymduongdouble.backend.member.web.dto.MemberResponse;
import com.gymduongdouble.backend.membership.domain.MemberMembership;
import com.gymduongdouble.backend.membership.repository.MemberMembershipRepository;
import com.gymduongdouble.backend.membership.service.MembershipLifecyclePolicy;
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
import com.gymduongdouble.backend.pt.web.dto.ReassignPtMemberRequest;
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

    private static final List<PtSessionStatus> CONSUMING_PT_SESSION_STATUSES = List.of(
        PtSessionStatus.COMPLETED,
        PtSessionStatus.MISSED
    );

    private final PtProfileRepository ptProfileRepository;
    private final PtAssignmentRepository ptAssignmentRepository;
    private final PtAssignmentPolicy ptAssignmentPolicy;
    private final PtScheduleRepository ptScheduleRepository;
    private final PtSessionPackageRepository ptSessionPackageRepository;
    private final PtSessionLogRepository ptSessionLogRepository;
    private final MemberActivityLogRepository memberActivityLogRepository;
    private final BodyMeasurementRepository bodyMeasurementRepository;
    private final PtGoalRepository ptGoalRepository;
    private final UserRepository userRepository;
    private final MemberService memberService;
    private final MemberMembershipRepository memberMembershipRepository;
    private final MembershipLifecyclePolicy membershipLifecyclePolicy;

    @Transactional(readOnly = true)
    public List<PtProfileResponse> listProfiles() {
        boolean includeFinancialDetails = isOwner();
        return ptProfileRepository.findAll().stream()
            .filter(profile -> profile.getUser().getRoles().stream()
                .anyMatch(role -> role.getCode().equals("PT")))
            .sorted(Comparator.comparing(profile -> profile.getUser().getFullName()))
            .map(profile -> PtProfileResponse.from(profile, includeFinancialDetails))
            .toList();
    }

    @Transactional
    public PtProfileResponse saveProfile(PtProfileRequest request) {
        User user = findUser(request.userId());
        ensureCanManagePtUser(user.getId());
        ensureUserHasRole(user, "PT", "Chỉ tài khoản PT mới được tạo hồ sơ huấn luyện viên.");
        boolean owner = isOwner();
        PtProfile profile = ptProfileRepository.findByUserId(user.getId()).orElseGet(() -> {
            if (!owner) {
                throw new AccessDeniedException("PT cannot create a trainer profile.");
            }
            return new PtProfile();
        });
        ensurePtCanOnlyUpdateOwnPublicProfile(request, owner);
        profile.setUser(user);
        if (owner) {
            profile.setPtLevel(request.ptLevel());
        }
        profile.setSpecialty(request.specialty());
        profile.setBio(request.bio());
        if (owner && request.baseSalary() != null) {
            profile.setBaseSalary(request.baseSalary());
        }
        if (owner && request.teachingRate() != null) {
            profile.setTeachingRate(request.teachingRate());
        }
        if (owner && request.salesCommissionRate() != null) {
            profile.setSalesCommissionRate(request.salesCommissionRate());
        }
        if (owner) {
            profile.setActive(request.active() == null || request.active());
        }
        return PtProfileResponse.from(ptProfileRepository.save(profile), owner);
    }

    @Transactional
    public PtAssignmentResponse assignMember(PtAssignmentRequest request) {
        User ptUser = findUser(request.ptUserId());
        ensureActivePtUser(ptUser, "Người phụ trách phải là tài khoản PT đang hoạt động.");
        ensureCanManagePtUser(ptUser.getId());
        Member member = memberService.findEntity(request.memberId());
        ensureOperationalMember(member);
        List<PtSessionPackage> assignablePackages = assignablePtPackages(member.getId(), request.startDate());
        if (assignablePackages.isEmpty()) {
            throw new BadRequestException("Chỉ có thể gán PT cho khách đang có gói PT còn hiệu lực.");
        }
        LocalDate packageEndDate = assignablePackages.stream()
            .map(PtSessionPackage::getEndDate)
            .max(LocalDate::compareTo)
            .orElseThrow();
        LocalDate assignmentEndDate = request.endDate() == null ? packageEndDate : request.endDate();
        ensureAssignmentDates(request.startDate(), assignmentEndDate);
        if (assignmentEndDate.isAfter(packageEndDate)) {
            throw new BadRequestException("Phân công PT không thể vượt quá hạn gói PT.");
        }
        ensureMemberHasNoActivePtAssignment(member.getId(), request.startDate());

        PtAssignment assignment = new PtAssignment();
        assignment.setPtUser(ptUser);
        assignment.setMember(member);
        assignment.setStartDate(request.startDate());
        assignment.setEndDate(assignmentEndDate);
        assignment.setStatus(PtAssignmentStatus.ACTIVE);
        assignment.setNote(request.note());

        assignablePackages.forEach(sessionPackage -> sessionPackage.setPtUser(ptUser));

        PtAssignment saved = ptAssignmentRepository.save(assignment);
        return PtAssignmentResponse.from(saved, ptAssignmentPolicy.effectiveStatus(saved, AppClock.today()));
    }

    @Transactional
    public PtAssignmentResponse reassignMember(Long assignmentId, ReassignPtMemberRequest request) {
        if (!isOwner()) {
            throw new AccessDeniedException("Chỉ chủ phòng được đổi PT phụ trách.");
        }

        PtAssignment currentAssignment = findAssignment(assignmentId);
        LocalDate today = AppClock.today();
        if (!ptAssignmentPolicy.isEffective(currentAssignment, today)) {
            throw new BadRequestException("Chỉ có thể đổi PT cho phân công đang hiệu lực.");
        }

        User nextPtUser = findUser(request.ptUserId());
        ensureActivePtUser(nextPtUser, "PT mới phải là tài khoản PT đang hoạt động.");
        if (currentAssignment.getPtUser().getId().equals(nextPtUser.getId())) {
            throw new BadRequestException("Hội viên này đang được phân công cho PT đã chọn.");
        }

        Member member = currentAssignment.getMember();
        ensureOperationalMember(member);
        List<PtSessionPackage> assignablePackages = assignablePtPackages(member.getId(), today);
        if (assignablePackages.isEmpty()) {
            throw new BadRequestException("Chỉ có thể đổi PT khi hội viên còn gói PT hiệu lực và còn buổi học.");
        }

        LocalDate packageEndDate = assignablePackages.stream()
            .map(PtSessionPackage::getEndDate)
            .max(LocalDate::compareTo)
            .orElseThrow();
        currentAssignment.setStatus(PtAssignmentStatus.ENDED);
        currentAssignment.setEndDate(today);

        PtAssignment replacement = new PtAssignment();
        replacement.setPtUser(nextPtUser);
        replacement.setMember(member);
        replacement.setStartDate(today);
        replacement.setEndDate(packageEndDate);
        replacement.setStatus(PtAssignmentStatus.ACTIVE);
        replacement.setNote(request.note());

        assignablePackages.forEach(sessionPackage -> sessionPackage.setPtUser(nextPtUser));
        ptScheduleRepository.findByMemberIdOrderByScheduleDateDesc(member.getId()).stream()
            .filter(schedule -> schedule.getStatus() == ScheduleStatus.SCHEDULED)
            .filter(schedule -> !isPastSchedule(schedule))
            .forEach(schedule -> schedule.setPtUser(nextPtUser));

        return PtAssignmentResponse.from(ptAssignmentRepository.save(replacement));
    }

    @Transactional(readOnly = true)
    public List<PtAssignmentResponse> listMyMembers(Long ptUserId) {
        Long resolvedPtUserId = resolveVisiblePtUserId(ptUserId);
        List<PtAssignment> assignments = resolvedPtUserId == null
            ? ptAssignmentRepository.findAll()
            : ptAssignmentRepository.findByPtUserId(resolvedPtUserId);

        return assignments.stream()
            .filter(assignment -> assignment.getMember().getStatus() == MemberStatus.ACTIVE)
            .filter(assignment -> ptAssignmentPolicy.canAccessMember(
                assignment.getMember().getId(),
                assignment.getPtUser().getId(),
                AppClock.today()
            ))
            .sorted(Comparator.comparing(assignment -> assignment.getMember().getFullName()))
            .map(assignment -> PtAssignmentResponse.from(
                assignment,
                ptAssignmentPolicy.effectiveStatus(assignment, AppClock.today())
            ))
            .toList();
    }

    @Transactional
    public PtScheduleResponse createSchedule(PtScheduleRequest request) {
        User ptUser = findUser(request.ptUserId());
        ensureActivePtUser(ptUser, "Lịch dạy phải gắn với tài khoản PT đang hoạt động.");
        Member member = request.memberId() == null ? null : memberService.findEntity(request.memberId());
        ensureCanManagePtUser(ptUser.getId());
        if (member != null) {
            ensureMemberCanBeScheduled(member, ptUser, request.scheduleDate());
        }

        LocalDate today = AppClock.today();
        if (request.scheduleDate().isBefore(today)) {
            throw new BadRequestException("Không thể đặt lịch dạy cho ngày trong quá khứ (" + request.scheduleDate() + ").");
        }
        if (request.scheduleDate().isEqual(today)) {
            LocalTime now = LocalTime.now(AppClock.zone());
            LocalTime nowMinusGrace = now.minusMinutes(2);
            if (request.startTime().isBefore(nowMinusGrace)) {
                String currentTimeStr = now.format(DateTimeFormatter.ofPattern("HH:mm"));
                throw new BadRequestException("Không thể đặt lịch dạy trong quá khứ (" + request.startTime() + "). Hiện tại là " + currentTimeStr + ", vui lòng chọn khung giờ hợp lệ.");
            }
        }
        if (request.endTime() != null && !request.endTime().isAfter(request.startTime())) {
            throw new BadRequestException("Giờ kết thúc phải sau giờ bắt đầu.");
        }
        ensureScheduleDoesNotOverlap(ptUser.getId(), member == null ? null : member.getId(), request);

        PtSchedule schedule = new PtSchedule();
        schedule.setPtUser(ptUser);
        schedule.setMember(member);
        schedule.setScheduleDate(request.scheduleDate());
        schedule.setStartTime(request.startTime());
        schedule.setEndTime(request.endTime());
        schedule.setStatus(ScheduleStatus.SCHEDULED);
        schedule.setNote(request.note());
        schedule.setCreatedBy(currentUserEntityOrNull());
        return PtScheduleResponse.from(ptScheduleRepository.save(schedule));
    }

    @Transactional
    public void deleteSchedule(Long scheduleId) {
        PtSchedule schedule = findSchedule(scheduleId);
        ensureCanManagePtUser(schedule.getPtUser().getId());
        if (schedule.getMember() != null) {
            ensureCanAccessMember(schedule.getMember().getId(), schedule.getScheduleDate());
        }
        if (ptSessionLogRepository.existsByScheduleId(scheduleId)) {
            throw new BadRequestException("Không thể xoá lịch dạy này vì buổi tập đã được ghi nhận trong lịch sử.");
        }
        if (schedule.getStatus() != ScheduleStatus.SCHEDULED || isPastSchedule(schedule)) {
            throw new BadRequestException("Chỉ có thể xoá lịch dạy chưa diễn ra. Lịch quá khứ cần được giữ lại để đối soát.");
        }
        ptScheduleRepository.delete(schedule);
    }

    @Transactional(readOnly = true)
    public List<PtScheduleResponse> listSchedules(Long ptUserId, LocalDate fromDate, LocalDate toDate) {
        LocalDate start = fromDate == null ? AppClock.today() : fromDate;
        LocalDate end = toDate == null ? start.plusDays(7) : toDate;
        Long resolvedPtUserId = resolveVisiblePtUserId(ptUserId);

        List<PtSchedule> schedules = resolvedPtUserId == null
            ? ptScheduleRepository.findByScheduleDateBetween(start, end)
            : ptScheduleRepository.findByPtUserIdAndScheduleDateBetween(resolvedPtUserId, start, end);

        return schedules.stream()
            .filter(schedule -> schedule.getMember() == null || schedule.getMember().getStatus() == MemberStatus.ACTIVE)
            .sorted(Comparator.comparing(PtSchedule::getScheduleDate).thenComparing(PtSchedule::getStartTime))
            .map(PtScheduleResponse::from)
            .toList();
    }

    @Transactional(readOnly = true)
    public PtMemberDetailResponse getMemberDetail(Long memberId) {
        ensureCanAccessMember(memberId);
        Member member = memberService.findEntity(memberId);
        LocalDate today = AppClock.today();
        return new PtMemberDetailResponse(
            MemberResponse.from(member),
            ptAssignmentRepository.findByMemberId(memberId).stream()
                .map(assignment -> PtAssignmentResponse.from(
                    assignment,
                    ptAssignmentPolicy.effectiveStatus(assignment, today)
                ))
                .toList(),
            listSessionPackageEntities(memberId).stream()
                .map(sessionPackage -> PtSessionPackageSummaryResponse.from(
                    sessionPackage,
                    membershipLifecyclePolicy.effectiveStatus(sessionPackage, today)
                ))
                .toList(),
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
            .map(sessionPackage -> PtSessionPackageSummaryResponse.from(
                sessionPackage,
                membershipLifecyclePolicy.effectiveStatus(sessionPackage, AppClock.today())
            ))
            .toList();
    }

    @Transactional
    public PtSessionLogResponse createSessionLog(Long memberId, PtSessionLogRequest request) {
        ensureCanAccessMember(memberId, request.sessionDate());
        ensureNotFuture(request.sessionDate(), "Ngày tập");
        PtSessionPackage sessionPackage = findSessionPackage(request.sessionPackageId());
        if (!sessionPackage.getMember().getId().equals(memberId)) {
            throw new BadRequestException("Gói buổi PT không thuộc khách hàng này.");
        }
        ensureUsableSessionPackage(sessionPackage, request.sessionDate(), true);
        PtSchedule schedule = request.scheduleId() == null ? null : findSchedule(request.scheduleId());
        if (schedule != null) {
            ensureScheduleCanBeLogged(schedule, sessionPackage, memberId, request.sessionDate());
        }
        PtSessionStatus status = request.status() == null ? PtSessionStatus.COMPLETED : request.status();
        ensureNoDuplicateSessionLog(sessionPackage, request, status);
        User ptUser = schedule != null
            ? schedule.getPtUser()
            : isOwner() ? sessionPackage.getPtUser() : currentUserEntityOrNull();

        PtSessionLog log = new PtSessionLog();
        log.setSessionPackage(sessionPackage);
        log.setMember(sessionPackage.getMember());
        log.setPtUser(ptUser);
        log.setSchedule(schedule);
        log.setSessionDate(request.sessionDate());
        log.setSessionNumber(request.sessionNumber());
        log.setWeight(request.weight());
        log.setStatus(status);
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
        ensureCanAccessMember(memberId, request.activityDate());
        ensureNotFuture(request.activityDate(), "Ngày hoạt động");
        Member member = memberService.findEntity(memberId);
        MemberMembership membership = request.membershipId() == null ? null : findMembership(request.membershipId());
        PtSessionPackage sessionPackage = request.sessionPackageId() == null ? null : findSessionPackage(request.sessionPackageId());

        if (membership != null && !membership.getMember().getId().equals(memberId)) {
            throw new BadRequestException("Lượt đăng ký gói không thuộc khách hàng này.");
        }
        if (sessionPackage != null && !sessionPackage.getMember().getId().equals(memberId)) {
            throw new BadRequestException("Gói buổi PT không thuộc khách hàng này.");
        }
        if (membership != null && sessionPackage != null
            && !sessionPackage.getMembership().getId().equals(membership.getId())) {
            throw new BadRequestException("Gói buổi PT không thuộc lượt đăng ký gói đã chọn.");
        }
        if (request.activityType() == ActivityType.PRACTICE && sessionPackage == null) {
            throw new BadRequestException("Buổi ôn tập cần chọn gói buổi PT.");
        }
        if (request.activityType() == ActivityType.PRACTICE) {
            ensureUsableSessionPackage(sessionPackage, request.activityDate(), false);
            ensureNoDuplicatePracticeLog(sessionPackage, request.activityDate());
            usePracticeSession(sessionPackage);
        }
        if (request.activityType() == ActivityType.GUIDANCE_CHECKIN) {
            ensureGuidanceMembershipCanBeLogged(membership, memberId, request.activityDate());
            ensureNoDuplicateGuidanceLog(membership, request.activityDate());
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
        ensureCanAccessMember(memberId, request.recordedAt());
        ensureNotFuture(request.recordedAt(), "Ngày đo");
        Member member = memberService.findEntity(memberId);

        BodyMeasurement measurement = new BodyMeasurement();
        measurement.setMember(member);
        measurement.setRecordedBy(currentUserEntityOrNull());
        measurement.setRecordedAt(request.recordedAt().atStartOfDay(AppClock.zone()).toInstant());
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
            ensureActivePtUser(ptUser, "Mục tiêu PT phải gắn với tài khoản PT đang hoạt động.");
            ensureCanManagePtUser(ptUser.getId());
        }
        ensureGoalDates(request.startDate(), request.targetDate());

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

    private void ensureMemberHasNoActivePtAssignment(Long memberId, LocalDate newStartDate) {
        boolean hasActiveAssignment = ptAssignmentRepository.findByMemberId(memberId).stream()
            .anyMatch(assignment -> ptAssignmentPolicy.isEffective(assignment, newStartDate));
        if (hasActiveAssignment) {
            throw new BadRequestException("Khách này đã có PT phụ trách. Vui lòng kết thúc phân công cũ trước khi gán PT mới.");
        }
    }

    private List<PtSessionPackage> assignablePtPackages(Long memberId, LocalDate date) {
        return ptSessionPackageRepository.findByMemberIdOrderByStartDateDesc(memberId).stream()
            .filter(sessionPackage -> membershipLifecyclePolicy.isEffective(sessionPackage, date))
            .filter(sessionPackage -> sessionPackage.getMembership().getPlan().getPlanType() == PlanType.PT)
            .filter(sessionPackage -> sessionPackage.getRemainingPtSessions() > 0 || sessionPackage.getRemainingPracticeSessions() > 0)
            .toList();
    }

    private void ensureScheduleDoesNotOverlap(Long ptUserId, Long memberId, PtScheduleRequest request) {
        boolean ptHasConflict = ptScheduleRepository
            .findByPtUserIdAndScheduleDateBetween(ptUserId, request.scheduleDate(), request.scheduleDate())
            .stream()
            .filter(this::isBlockingSchedule)
            .anyMatch(schedule -> overlaps(schedule.getStartTime(), schedule.getEndTime(), request.startTime(), request.endTime()));
        if (ptHasConflict) {
            throw new BadRequestException("PT đã có lịch trùng khung giờ này.");
        }

        if (memberId == null) {
            return;
        }
        boolean memberHasConflict = ptScheduleRepository
            .findByMemberIdAndScheduleDateBetween(memberId, request.scheduleDate(), request.scheduleDate())
            .stream()
            .filter(this::isBlockingSchedule)
            .anyMatch(schedule -> overlaps(schedule.getStartTime(), schedule.getEndTime(), request.startTime(), request.endTime()));
        if (memberHasConflict) {
            throw new BadRequestException("Học viên đã có lịch PT trùng khung giờ này.");
        }
    }

    private boolean isBlockingSchedule(PtSchedule schedule) {
        return schedule.getStatus() == ScheduleStatus.SCHEDULED;
    }

    private boolean overlaps(LocalTime existingStart, LocalTime existingEnd, LocalTime nextStart, LocalTime nextEnd) {
        LocalTime safeExistingEnd = existingEnd == null ? existingStart.plusHours(1) : existingEnd;
        LocalTime safeNextEnd = nextEnd == null ? nextStart.plusHours(1) : nextEnd;
        return nextStart.isBefore(safeExistingEnd) && safeNextEnd.isAfter(existingStart);
    }

    private void ensureScheduleCanBeLogged(PtSchedule schedule, PtSessionPackage sessionPackage, Long memberId, LocalDate sessionDate) {
        if (schedule.getStatus() != ScheduleStatus.SCHEDULED) {
            throw new BadRequestException("Chỉ lịch đang chờ dạy mới được ghi nhận buổi tập.");
        }
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
        return CONSUMING_PT_SESSION_STATUSES.contains(status);
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
        if (!membershipLifecyclePolicy.isEffective(sessionPackage, activityDate)) {
            throw new BadRequestException("Gói PT không còn hoạt động.");
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
        if (!membershipLifecyclePolicy.isEffective(membership, activityDate)) {
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

    private void ensureNoDuplicateSessionLog(PtSessionPackage sessionPackage, PtSessionLogRequest request, PtSessionStatus status) {
        if (request.scheduleId() != null || !shouldConsumePtSession(status)) {
            return;
        }
        boolean duplicated = request.sessionNumber() != null
            ? ptSessionLogRepository.existsBySessionPackageIdAndSessionNumberAndStatusIn(
                sessionPackage.getId(),
                request.sessionNumber(),
                CONSUMING_PT_SESSION_STATUSES
            )
            : ptSessionLogRepository.existsBySessionPackageIdAndSessionDateAndStatusIn(
                sessionPackage.getId(),
                request.sessionDate(),
                CONSUMING_PT_SESSION_STATUSES
            );
        if (duplicated) {
            throw new BadRequestException("Buổi PT này đã được ghi nhận, không thể trừ buổi lần nữa.");
        }
    }

    private void ensureNoDuplicatePracticeLog(PtSessionPackage sessionPackage, LocalDate activityDate) {
        boolean duplicated = memberActivityLogRepository.existsBySessionPackageIdAndActivityDateAndActivityType(
            sessionPackage.getId(),
            activityDate,
            ActivityType.PRACTICE
        );
        if (duplicated) {
            throw new BadRequestException("Buổi ôn tập này đã được ghi nhận, không thể trừ buổi lần nữa.");
        }
    }

    private void ensureNoDuplicateGuidanceLog(MemberMembership membership, LocalDate activityDate) {
        boolean duplicated = memberActivityLogRepository.existsByMembershipIdAndActivityDateAndActivityType(
            membership.getId(),
            activityDate,
            ActivityType.GUIDANCE_CHECKIN
        );
        if (duplicated) {
            throw new BadRequestException("Buổi hướng dẫn/trị liệu này đã được ghi nhận.");
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

    private void ensureActivePtUser(User user, String message) {
        ensureUserHasRole(user, "PT", message);
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new BadRequestException(message);
        }
        PtProfile profile = ptProfileRepository.findByUserId(user.getId())
            .orElseThrow(() -> new BadRequestException(message));
        if (!profile.isActive()) {
            throw new BadRequestException(message);
        }
    }

    private void ensureAssignmentDates(LocalDate startDate, LocalDate endDate) {
        if (endDate != null && endDate.isBefore(startDate)) {
            throw new BadRequestException("Ngày kết thúc phân công phải sau hoặc bằng ngày bắt đầu.");
        }
    }

    private void ensureGoalDates(LocalDate startDate, LocalDate targetDate) {
        if (startDate != null && targetDate != null && targetDate.isBefore(startDate)) {
            throw new BadRequestException("Ngày mục tiêu phải sau hoặc bằng ngày bắt đầu.");
        }
    }

    private void ensureNotFuture(LocalDate date, String fieldName) {
        if (date != null && date.isAfter(AppClock.today())) {
            throw new BadRequestException(fieldName + " không được ở tương lai.");
        }
    }

    private void ensureCanAccessMember(Long memberId) {
        ensureCanAccessMember(memberId, AppClock.today());
    }

    private void ensureCanAccessMember(Long memberId, LocalDate date) {
        if (isOwner()) {
            return;
        }
        Member member = memberService.findEntity(memberId);
        if (member.getStatus() != MemberStatus.ACTIVE
            || !ptAssignmentPolicy.canAccessMember(memberId, currentUserId(), date)) {
            throw new AccessDeniedException("PT chỉ được xem khách được phân công.");
        }
    }

    private void ensureMemberCanBeScheduled(Member member, User ptUser, LocalDate scheduleDate) {
        ensureOperationalMember(member);
        if (!ptAssignmentPolicy.canAccessMember(member.getId(), ptUser.getId(), scheduleDate)
            || !ptAssignmentPolicy.hasAccessiblePtPackage(member.getId(), ptUser.getId(), scheduleDate)) {
            throw new BadRequestException("PT phụ trách phải được phân công cho học viên và gói PT còn hiệu lực vào ngày đặt lịch.");
        }
    }

    private void ensureOperationalMember(Member member) {
        if (member.getStatus() != MemberStatus.ACTIVE) {
            throw new BadRequestException("Hội viên đang ngừng hoạt động hoặc đã lưu trữ, không thể điều phối PT.");
        }
    }

    private void ensurePtCanOnlyUpdateOwnPublicProfile(PtProfileRequest request, boolean owner) {
        if (owner) {
            return;
        }
        if (request.baseSalary() != null
            || request.teachingRate() != null
            || request.salesCommissionRate() != null
            || request.active() != null) {
            throw new AccessDeniedException("PT cannot change salary, rates, commission, or account status.");
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

    private PtAssignment findAssignment(Long id) {
        return ptAssignmentRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phân công PT."));
    }

    private boolean isPastSchedule(PtSchedule schedule) {
        LocalDate today = AppClock.today();
        if (schedule.getScheduleDate().isBefore(today)) {
            return true;
        }
        return schedule.getScheduleDate().isEqual(today)
            && schedule.getStartTime().isBefore(LocalTime.now(AppClock.zone()).minusMinutes(2));
    }

    private MemberMembership findMembership(Long id) {
        return memberMembershipRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lượt đăng ký gói."));
    }
}
