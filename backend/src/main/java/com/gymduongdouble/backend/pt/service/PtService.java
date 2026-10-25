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

    /**
     * DANH SÁCH TRẠNG THÁI TIÊU HAO BUỔI TẬP (Consuming PT Session Statuses):
     * - COMPLETED: Học viên đã đến tập và hoàn thành buổi tập -> Trừ 1 buổi (remaining - 1).
     * - MISSED: Học viên vắng mặt không báo trước (bùng kèo) -> VẪN TRỪ 1 buổi (remaining - 1).
     *   Lý do: Đây là chính sách vận hành của phòng gym nhằm bảo vệ quyền lợi và thời gian chờ của HLV.
     * <p>
     * LƯU Ý KHI REVIEW:
     * Hai trạng thái CANCELLED (Học viên xin hủy lịch hợp lệ) và RESCHEDULED (Dời sang buổi khác)
     * CỐ TÌNH KHÔNG NẰM TRONG DANH SÁCH NÀY -> Tuyệt đối không bị trừ buổi tập trong gói.
     */
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
        boolean owner = isOwner();
        PtProfile profile = ptProfileRepository.findByUserId(user.getId()).orElseGet(() -> {
            if (!owner) {
                throw new AccessDeniedException("PT cannot create a trainer profile.");
            }
            return new PtProfile();
        });
        ensurePtCanOnlyUpdateOwnProfile(request, owner);
        profile.setUser(user);
        if (owner) {
            profile.setPtLevel(request.ptLevel());
        }
        profile.setSpecialty(request.specialty());
        profile.setBio(request.bio());
        if (owner) {
            profile.setActive(request.active() == null || request.active());
        }
        return PtProfileResponse.from(ptProfileRepository.save(profile));
    }

    /**
     * Phân công Huấn luyện viên phụ trách Hội viên (Gán học viên mới).
     * <p>
     * QUY TRÌNH 5 CỔNG KIỂM TRA CHẶT CHẼ:
     * - Cổng 1: Xác thực tài khoản PT hợp lệ và đang hoạt động (UserStatus.ACTIVE, có PtProfile active).
     * - Cổng 2: Phân quyền thao tác: OWNER có thể gán mọi PT; PT chỉ được phép gán học viên cho chính mình.
     * - Cổng 3: Hội viên phải ở trạng thái ACTIVE (không bị tạm ngưng hay lưu trữ).
     * - Cổng 4: Quét các gói PT hiệu lực tại startDate và còn ít nhất 1 buổi PT hoặc 1 buổi ôn tập.
     *   Chặn phân công nếu endDate vượt quá ngày hết hạn muộn nhất của các gói (packageEndDate).
     * - Cổng 5: Chặn trùng phân công: Hội viên không được có phân công nào khác đang hiệu lực tại startDate.
     * <p>
     * TÍNH NHẤT QUÁN GIAO DỊCH (Transaction Consistency):
     * Cập nhật `ptUser` trên các gói `PtSessionPackage` và lưu `PtAssignment` trong cùng một @Transactional.
     */
    @Transactional
    public PtAssignmentResponse assignMember(PtAssignmentRequest request) {
        // [CỔNG 1] Thẩm định tư cách HLV: Phải có Role PT, User active, và PtProfile active
        User ptUser = findUser(request.ptUserId());
        ensureActivePtUser(ptUser, "Người phụ trách phải là tài khoản PT đang hoạt động.");
        
        // [CỔNG 2] Phân quyền: OWNER có toàn quyền; PT chỉ được gán học viên cho chính mình
        ensureCanManagePtUser(ptUser.getId());
        
        // [CỔNG 3] Kiểm tra trạng thái hội viên: Phải là ACTIVE
        Member member = memberService.findEntity(request.memberId());
        ensureOperationalMember(member);
        
        // [CỔNG 4] Quét các gói PT còn hiệu lực tại startDate và còn buổi tập
        List<PtSessionPackage> assignablePackages = assignablePtPackages(member.getId(), request.startDate());
        if (assignablePackages.isEmpty()) {
            throw new BadRequestException("Chỉ có thể gán PT cho khách đang có gói PT còn hiệu lực.");
        }
        
        // Tính toán hạn chót phân công: Mặc định bằng hạn gói muộn nhất, không được vượt quá hạn này
        LocalDate packageEndDate = assignablePackages.stream()
            .map(PtSessionPackage::getEndDate)
            .max(LocalDate::compareTo)
            .orElseThrow();
        LocalDate assignmentEndDate = request.endDate() == null ? packageEndDate : request.endDate();
        ensureAssignmentDates(request.startDate(), assignmentEndDate);
        if (assignmentEndDate.isAfter(packageEndDate)) {
            throw new BadRequestException("Phân công PT không thể vượt quá hạn gói PT.");
        }
        
        // [CỔNG 5] Ngăn chặn trùng lặp phân công tại ngày bắt đầu
        ensureMemberHasNoActivePtAssignment(member.getId(), request.startDate());

        PtAssignment assignment = new PtAssignment();
        assignment.setPtUser(ptUser);
        assignment.setMember(member);
        assignment.setStartDate(request.startDate());
        assignment.setEndDate(assignmentEndDate);
        assignment.setStatus(PtAssignmentStatus.ACTIVE);
        assignment.setNote(request.note());

        // ĐỒNG BỘ GÓI TẬP: Gán HLV phụ trách trực tiếp vào các gói buổi tập của hội viên
        assignablePackages.forEach(sessionPackage -> sessionPackage.setPtUser(ptUser));

        PtAssignment saved = ptAssignmentRepository.save(assignment);
        return PtAssignmentResponse.from(saved, ptAssignmentPolicy.effectiveStatus(saved, AppClock.today()));
    }

    /**
     * Chuyển đổi Huấn luyện viên phụ trách (Reassign PT) - Chỉ dành riêng cho Chủ phòng (OWNER).
     * <p>
     * NGUYÊN TẮC "KHÔNG VIẾT LẠI QUÁ KHỨ" (Historical Integrity):
     * 1. Không sửa đổi phân công cũ thành PT mới, mà chốt kết thúc phân công cũ (status = ENDED, endDate = today).
     * 2. Khởi tạo một bản ghi phân công mới (PtAssignment) từ ngày hôm nay đến hạn gói cho PT mới.
     * 3. Đồng bộ PT mới vào các gói tập PtSessionPackage của hội viên.
     * 4. Cập nhật lịch hẹn tương lai: Chỉ đổi PT trên các lịch đang chờ dạy (SCHEDULED) và chưa diễn ra.
     *    Toàn bộ lịch đã hoàn thành, đã hủy, vắng mặt hoặc nhật ký buổi tập quá khứ GIỮ NGUYÊN PT CŨ.
     */
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
            
        // Bước 1: Chốt kết thúc phân công cũ vào ngày hôm nay
        currentAssignment.setStatus(PtAssignmentStatus.ENDED);
        currentAssignment.setEndDate(today);

        // Bước 2: Tạo phân công mới cho PT kế nhiệm từ hôm nay đến hết hạn gói
        PtAssignment replacement = new PtAssignment();
        replacement.setPtUser(nextPtUser);
        replacement.setMember(member);
        replacement.setStartDate(today);
        replacement.setEndDate(packageEndDate);
        replacement.setStatus(PtAssignmentStatus.ACTIVE);
        replacement.setNote(request.note());

        // Bước 3: Cập nhật HLV phụ trách trên các gói tập còn hiệu lực
        assignablePackages.forEach(sessionPackage -> sessionPackage.setPtUser(nextPtUser));
        
        // Bước 4: Chuyển các lịch hẹn tương lai chưa diễn ra (SCHEDULED) sang PT mới
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

    /**
     * Tạo mới lịch hẹn tập luyện giữa Huấn luyện viên và Hội viên.
     * <p>
     * CÁC QUY TẮC THẨM ĐỊNH THỜI GIAN & XUNG ĐỘT:
     * 1. Hợp lệ HLV & Học viên: HLV phải active; nếu gắn học viên thì học viên phải active và có gói PT hiệu lực vào ngày lịch.
     * 2. Ranh giới thời gian:
     *    - Tuyệt đối không cho phép đặt lịch cho các ngày trong quá khứ.
     *    - Nếu đặt lịch cho ngày hôm nay: Giờ bắt đầu không được sớm hơn hiện tại trừ dung sai 2 phút (grace period).
     *    - Giờ kết thúc (nếu có) phải sau giờ bắt đầu.
     * 3. Chống xung đột (overlaps):
     *    - Quét toàn bộ lịch SCHEDULED trong cùng ngày của HLV và của Học viên để ngăn chồng chéo khung giờ.
     * 4. Nguyên tắc định mức:
     *    - Đặt lịch KHÔNG trừ buổi tập trong PtSessionPackage. Buổi tập chỉ bị trừ khi ghi nhận kết quả (PtSessionLog).
     */
    @Transactional
    public PtScheduleResponse createSchedule(PtScheduleRequest request) {
        User ptUser = findUser(request.ptUserId());
        ensureActivePtUser(ptUser, "Lịch dạy phải gắn với tài khoản PT đang hoạt động.");
        Member member = request.memberId() == null ? null : memberService.findEntity(request.memberId());
        ensureCanManagePtUser(ptUser.getId());
        if (member != null) {
            ensureMemberCanBeScheduled(member, ptUser, request.scheduleDate());
        }

        // Kiểm tra tính hợp lệ của ngày và giờ đặt lịch
        LocalDate today = AppClock.today();
        if (request.scheduleDate().isBefore(today)) {
            throw new BadRequestException("Không thể đặt lịch dạy cho ngày trong quá khứ (" + request.scheduleDate() + ").");
        }
        if (request.scheduleDate().isEqual(today)) {
            LocalTime now = LocalTime.now(AppClock.zone());
            LocalTime nowMinusGrace = now.minusMinutes(2); // Cho phép dung sai 2 phút tránh trễ mạng
            if (request.startTime().isBefore(nowMinusGrace)) {
                String currentTimeStr = now.format(DateTimeFormatter.ofPattern("HH:mm"));
                throw new BadRequestException("Không thể đặt lịch dạy trong quá khứ (" + request.startTime() + "). Hiện tại là " + currentTimeStr + ", vui lòng chọn khung giờ hợp lệ.");
            }
        }
        if (request.endTime() != null && !request.endTime().isAfter(request.startTime())) {
            throw new BadRequestException("Giờ kết thúc phải sau giờ bắt đầu.");
        }
        
        // Kiểm tra xung đột lịch cả 2 phía: Lịch của HLV và Lịch của Học viên
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

    /**
     * Xóa lịch hẹn tập luyện chưa diễn ra.
     * <p>
     * ĐIỀU KIỆN XÓA AN TOÀN:
     * 1. Quyền hạn: Phải là OWNER hoặc chính HLV đứng lịch; nếu có học viên thì phải có quyền truy cập học viên ngày đó.
     * 2. Chưa ghi log: Lịch chưa được gắn với bất kỳ bản ghi nhật ký buổi tập nào (PtSessionLog).
     * 3. Trạng thái còn SCHEDULED và chưa qua: Lịch đã qua hoặc đã có kết quả (COMPLETED, MISSED, CANCELLED)
     *    phải được giữ lại trong DB để phục vụ kiểm toán và đối soát dữ liệu.
     * 4. Cơ chế: Xóa trực tiếp bản ghi (Hard Delete) khỏi pt_schedules; không làm thay đổi số dư buổi tập.
     */
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

    /**
     * Ghi nhận kết quả buổi tập PT 1:1 và tiêu hao định mức buổi tập (Check-in / Log Session).
     * <p>
     * QUY TRÌNH THẨM ĐỊNH VÀ ĐỒNG BỘ 6 BƯỚC:
     * 1. Quyền truy cập: Kiểm tra PT có quyền thao tác trên học viên tại ngày tập (chống IDOR).
     * 2. Ranh giới thời gian: Ngày tập tuyệt đối không được ở tương lai.
     * 3. Tính toàn vẹn sở hữu: Gói tập (PtSessionPackage) phải thuộc đúng học viên này.
     * 4. Trạng thái gói: Gói phải còn hiệu lực và còn ít nhất 1 buổi PT (remainingPtSessions > 0).
     * 5. Khớp lịch hẹn (nếu có chọn lịch): Lịch phải đang SCHEDULED, đúng học viên, đúng ngày,
     *    đúng HLV phụ trách gói, và chưa từng được ghi nhận trước đó.
     * 6. Chống trùng lặp (Duplicate Defense): Ngăn chặn ghi đúp 2 lần cho cùng một buổi tập.
     * <p>
     * TÁC ĐỘNG SỐ DƯ & TRẠNG THÁI:
     * - Tiêu hao buổi tập: Chỉ khi status là COMPLETED hoặc MISSED mới gọi usePtSession() để giảm remainingPtSessions.
     * - Đồng bộ lịch: Nếu có scheduleId, tự động chuyển trạng thái lịch tương ứng (COMPLETED, MISSED, CANCELLED, RESCHEDULED).
     */
    @Transactional
    public PtSessionLogResponse createSessionLog(Long memberId, PtSessionLogRequest request) {
        // [BƯỚC 1] Kiểm tra quyền truy cập học viên tại ngày tập
        ensureCanAccessMember(memberId, request.sessionDate());
        
        // [BƯỚC 2] Chặn ghi nhận buổi tập ở ngày tương lai
        ensureNotFuture(request.sessionDate(), "Ngày tập");
        
        // [BƯỚC 3] Thẩm định tính toàn vẹn: Gói PT phải thuộc sở hữu của học viên này
        PtSessionPackage sessionPackage = findSessionPackage(request.sessionPackageId());
        if (!sessionPackage.getMember().getId().equals(memberId)) {
            throw new BadRequestException("Gói buổi PT không thuộc khách hàng này.");
        }
        
        // [BƯỚC 4] Gói PT phải còn hiệu lực hôm nay và còn số dư buổi tập (> 0)
        ensureUsableSessionPackage(sessionPackage, request.sessionDate(), true);
        
        // [BƯỚC 5] Nếu có chọn lịch hẹn, kiểm tra tính hợp lệ và duy nhất của lịch
        PtSchedule schedule = request.scheduleId() == null ? null : findSchedule(request.scheduleId());
        if (schedule != null) {
            ensureScheduleCanBeLogged(schedule, sessionPackage, memberId, request.sessionDate());
        }
        
        // Mặc định trạng thái là COMPLETED nếu client không truyền
        PtSessionStatus status = request.status() == null ? PtSessionStatus.COMPLETED : request.status();
        
        // [BƯỚC 6] Chống ghi nhận trùng lặp buổi tập
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

        // TIÊU HAO BUỔI TẬP: Chỉ trừ khi trạng thái là COMPLETED hoặc MISSED
        if (shouldConsumePtSession(log.getStatus())) {
            usePtSession(sessionPackage);
        }
        
        // ĐỒNG BỘ LỊCH HẸN: Chuyển trạng thái lịch sang COMPLETED, MISSED, CANCELLED hoặc RESCHEDULED
        if (schedule != null) {
            schedule.setStatus(scheduleStatusFor(log.getStatus()));
        }

        return PtSessionLogResponse.from(ptSessionLogRepository.save(log));
    }

    /**
     * Ghi nhận hoạt động tự ôn tập (PRACTICE) hoặc điểm danh gói hướng dẫn (GUIDANCE_CHECKIN).
     * <p>
     * HAI NHÁNH NGHIỆP VỤ ĐỘC LẬP:
     * 1. PRACTICE (Tự ôn tập của gói PT):
     *    - Gắn với PtSessionPackage.
     *    - Giảm số buổi ôn tập còn lại (remainingPracticeSessions - 1) qua usePracticeSession().
     *    - Mỗi ngày chỉ được ghi tối đa 1 buổi ôn tập cho cùng một gói tập.
     * 2. GUIDANCE_CHECKIN (Điểm danh gói hướng dẫn / Cổ Vai Gáy):
     *    - Gắn với MemberMembership loại GUIDANCE.
     *    - Kiểm soát định mức: Nếu gói quy định số buổi hướng dẫn (guidanceSessionCount > 0),
     *      hệ thống đếm số lần đã check-in và chặn khi đã dùng hết số buổi.
     *    - Mỗi ngày chỉ được check-in tối đa 1 lần cho cùng một gói.
     */
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
        
        // Nhánh 1: Tự ôn tập (PRACTICE) -> Trừ buổi trong PtSessionPackage
        if (request.activityType() == ActivityType.PRACTICE) {
            ensureUsableSessionPackage(sessionPackage, request.activityDate(), false);
            ensureNoDuplicatePracticeLog(sessionPackage, request.activityDate());
            usePracticeSession(sessionPackage);
        }
        
        // Nhánh 2: Điểm danh hướng dẫn (GUIDANCE_CHECKIN) -> Kiểm soát định mức theo MemberMembership
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

    /**
     * Ghi nhận số đo chỉ số cơ thể thực tế (Body Measurement Tracking).
     * <p>
     * ĐẶC TÍNH LƯU TRỮ (Append-only History):
     * 1. Dữ liệu quan sát thực tế (Observed Data): Lưu lại kết quả đo InBody/thước dây thực tế.
     * 2. Không ghi đè (No overwrite): Mỗi lần đo là một bản ghi mới trong body_measurements để vẽ biểu đồ tiến trình.
     *    "Chỉ số hiện tại" trên giao diện là bản ghi có recordedAt mới nhất, không phải một cột tĩnh trong bảng members.
     * 3. Chặn ngày tương lai và chuyển đổi múi giờ: Chuyển LocalDate sang Instant đầu ngày theo AppClock.zone().
     */
    @Transactional
    public BodyMeasurementResponse createBodyMeasurement(Long memberId, BodyMeasurementRequest request) {
        ensureCanAccessMember(memberId, request.recordedAt());
        ensureNotFuture(request.recordedAt(), "Ngày đo");
        Member member = memberService.findEntity(memberId);

        BodyMeasurement measurement = new BodyMeasurement();
        measurement.setMember(member);
        measurement.setRecordedBy(currentUserEntityOrNull());
        // Chuyển đổi ngày đo sang Instant theo múi giờ hệ thống
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

    /**
     * Thiết lập mục tiêu luyện tập cho Hội viên (Training Goals).
     * <p>
     * NGUYÊN TẮC QUẢN TRỊ MỤC TIÊU:
     * 1. Dữ liệu kỳ vọng (Target / Expected Data): Lưu trữ đích đến mong muốn (cân nặng đích, mỡ đích, vòng eo đích).
     * 2. Phân biệt với số đo: Mục tiêu KHÔNG TỰ ĐỘNG chuyển thành COMPLETED khi cân nặng chạm ngưỡng.
     *    Hệ thống để HLV và học viên cùng đánh giá toàn diện thể trạng thực tế, không tự động hóa kết luận y khoa.
     * 3. Ranh giới thời gian: Ngày đích (targetDate) phải sau hoặc bằng ngày bắt đầu (startDate).
     */
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

    /**
     * KIỂM TRA XUNG ĐỘT TRÙNG LỊCH HẸN (SCHEDULE CONFLICT DETECTION):
     * Quét và chặn xung đột lịch trên cả 2 phương diện:
     * 1. Phía HLV (PT conflict): HLV không thể cùng lúc dạy 2 lịch trùng nhau.
     * 2. Phía Hội viên (Member conflict): Học viên không thể cùng lúc có 2 lịch hẹn trùng nhau.
     * Chỉ những lịch đang ở trạng thái SCHEDULED mới được coi là chiếm chỗ (blocking).
     */
    private void ensureScheduleDoesNotOverlap(Long ptUserId, Long memberId, PtScheduleRequest request) {
        // Kiểm tra xung đột lịch của HLV trong ngày
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
        // Kiểm tra xung đột lịch của Học viên trong ngày
        boolean memberHasConflict = ptScheduleRepository
            .findByMemberIdAndScheduleDateBetween(memberId, request.scheduleDate(), request.scheduleDate())
            .stream()
            .filter(this::isBlockingSchedule)
            .anyMatch(schedule -> overlaps(schedule.getStartTime(), schedule.getEndTime(), request.startTime(), request.endTime()));
        if (memberHasConflict) {
            throw new BadRequestException("Học viên đã có lịch PT trùng khung giờ này.");
        }
    }

    /**
     * Chỉ những lịch đang ở trạng thái SCHEDULED (Chờ dạy) mới gây khóa/chiếm slot thời gian.
     * Các lịch COMPLETED, CANCELLED, MISSED hoặc RESCHEDULED không gây chặn lịch mới.
     */
    private boolean isBlockingSchedule(PtSchedule schedule) {
        return schedule.getStatus() == ScheduleStatus.SCHEDULED;
    }

    /**
     * THUẬT TOÁN KIỂM TRA CHỒNG CHÉO THỜI GIAN (Strict Time Overlapping):
     * Điều kiện chồng: `nextStart < safeExistingEnd && safeNextEnd > existingStart`
     * <p>
     * VÍ DỤ MINH HỌA:
     * - Case 1: Lịch cũ 18:00 - 19:00, Lịch mới 19:00 - 20:00 (Sát biên):
     *   -> nextStart (19:00).isBefore(existingEnd (19:00)) == FALSE -> KHÔNG TRÙNG (Hợp lệ).
     * - Case 2: Lịch cũ 18:00 - 19:00, Lịch mới 18:30 - 19:30 (Chồng chéo):
     *   -> 18:30 < 19:00 (TRUE) VÀ 19:30 > 18:00 (TRUE) -> TRÙNG LỊCH (Bị chặn).
     * - Nếu không có endTime, mặc định tạm tính ca tập kéo dài 1 tiếng (start.plusHours(1)).
     */
    private boolean overlaps(LocalTime existingStart, LocalTime existingEnd, LocalTime nextStart, LocalTime nextEnd) {
        LocalTime safeExistingEnd = existingEnd == null ? existingStart.plusHours(1) : existingEnd;
        LocalTime safeNextEnd = nextEnd == null ? nextStart.plusHours(1) : nextEnd;
        return nextStart.isBefore(safeExistingEnd) && safeNextEnd.isAfter(existingStart);
    }

    /**
     * Thẩm định tính hợp lệ của Lịch hẹn khi ghi nhận buổi tập:
     * 1. Trạng thái: Lịch phải đang ở trạng thái SCHEDULED (Chờ dạy).
     * 2. Đúng học viên: Lịch phải thuộc về hội viên đang ghi nhận (chống nhầm lẫn).
     * 3. Đúng ngày: Ngày ghi buổi phải trùng khớp với scheduleDate.
     * 4. Đúng HLV: HLV đứng lịch phải là HLV đang phụ trách gói PT này.
     * 5. Tính duy nhất: Lịch hẹn này chưa từng được gắn với bất kỳ bản ghi PtSessionLog nào trước đó.
     */
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

    /**
     * Kiểm tra tính khả dụng của gói PT:
     * - Gói phải còn hiệu lực hôm nay (membershipLifecyclePolicy.isEffective).
     * - Nếu là buổi tập PT 1:1 (requirePtSession = true): Bắt buộc số dư remainingPtSessions > 0.
     */
    private void ensureUsableSessionPackage(PtSessionPackage sessionPackage, LocalDate activityDate, boolean requirePtSession) {
        if (!membershipLifecyclePolicy.isEffective(sessionPackage, activityDate)) {
            throw new BadRequestException("Gói PT không còn hoạt động.");
        }
        if (requirePtSession && sessionPackage.getRemainingPtSessions() <= 0) {
            throw new BadRequestException("Gói PT không còn buổi PT để check-in.");
        }
    }

    /**
     * Kiểm tra điều kiện điểm danh gói Hướng dẫn / Cổ Vai Gáy:
     * 1. Gói phải thuộc hội viên và có loại gói là GUIDANCE.
     * 2. Gói phải còn hiệu lực tại ngày điểm danh.
     * 3. KIỂM SOÁT ĐỊNH MỨC TỰ ĐỘNG: Nếu gói khai báo số buổi hướng dẫn (guidanceSessionCount > 0),
     *    hệ thống đếm số lần đã check-in trong member_activity_logs và chặn khi đã dùng hết số buổi.
     */
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

    /**
     * Chống ghi nhận trùng lặp buổi tập PT:
     * - Nếu có chọn lịch (scheduleId != null): Bản thân scheduleId đã là khóa nghiệp vụ duy nhất.
     * - Nếu ghi độc lập (scheduleId == null):
     *   + Nếu có số buổi (sessionNumber): Chống trùng theo (sessionPackage, sessionNumber, status tiêu buổi).
     *   + Nếu không có số buổi: Chống trùng theo (sessionPackage, sessionDate, status tiêu buổi).
     */
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

    /**
     * Chống ghi đúp buổi tự ôn tập trong cùng 1 ngày cho cùng một gói tập.
     */
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

    /**
     * Chống ghi đúp điểm danh hướng dẫn trong cùng 1 ngày cho cùng một gói tập.
     */
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

    /**
     * Tiêu hao 1 buổi tập PT chính (HLV kèm 1:1):
     * Tăng usedPtSessions lên 1, giảm remainingPtSessions đi 1, và kiểm tra hoàn thành gói.
     */
    private void usePtSession(PtSessionPackage sessionPackage) {
        if (sessionPackage.getRemainingPtSessions() <= 0) {
            throw new BadRequestException("Gói PT không còn buổi PT để check-in.");
        }
        sessionPackage.setUsedPtSessions(sessionPackage.getUsedPtSessions() + 1);
        sessionPackage.setRemainingPtSessions(sessionPackage.getRemainingPtSessions() - 1);
        completePackageIfNeeded(sessionPackage);
    }

    /**
     * Tiêu hao 1 buổi tự ôn tập (Practice Session):
     * Tăng usedPracticeSessions lên 1, giảm remainingPracticeSessions đi 1, và kiểm tra hoàn thành gói.
     */
    private void usePracticeSession(PtSessionPackage sessionPackage) {
        if (sessionPackage.getRemainingPracticeSessions() <= 0) {
            throw new BadRequestException("Gói PT không còn buổi ôn tập để check-in.");
        }
        sessionPackage.setUsedPracticeSessions(sessionPackage.getUsedPracticeSessions() + 1);
        sessionPackage.setRemainingPracticeSessions(sessionPackage.getRemainingPracticeSessions() - 1);
        completePackageIfNeeded(sessionPackage);
    }

    /**
     * Điều kiện chốt hoàn thành gói tập PT:
     * CHỈ KHI CẢ HAI ĐỀU HẾT: remainingPtSessions <= 0 VÀ remainingPracticeSessions <= 0.
     * Nếu học viên đã học hết buổi với HLV nhưng vẫn còn buổi tự ôn tập thì gói vẫn ở trạng thái ACTIVE.
     */
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

    /**
     * KIỂM TRA ĐIỀU KIỆN TƯ CÁCH HUẤN LUYỆN VIÊN (Active PT Account Validation):
     * Bắt buộc thỏa mãn đồng thời 3 điều kiện:
     * 1. Tài khoản User phải sở hữu quyền/Role "PT".
     * 2. Trạng thái tài khoản User phải là ACTIVE.
     * 3. Phải có bản ghi hồ sơ HLV (PtProfile) và trạng thái profile phải là ACTIVE.
     * <p>
     * CHỦ PHÒNG KIÊM PT (Owner as PT):
     * Nếu tài khoản có vai trò OWNER muốn trực tiếp nhận phân công dạy hoặc lên lịch cho học viên,
     * tài khoản đó vẫn bắt buộc phải được cấp Role PT và có PtProfile active; quyền OWNER không thể
     * thay thế cho các ràng buộc tư cách chuyên môn này.
     */
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

    private void ensurePtCanOnlyUpdateOwnProfile(PtProfileRequest request, boolean owner) {
        if (owner) {
            return;
        }
        if (request.active() != null) {
            throw new AccessDeniedException("PT cannot change account status.");
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
