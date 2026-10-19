package com.gymduongdouble.backend.common.config;

import com.gymduongdouble.backend.common.domain.SystemSetting;
import com.gymduongdouble.backend.common.enums.ActivityType;
import com.gymduongdouble.backend.common.enums.DebtStatus;
import com.gymduongdouble.backend.common.enums.ExerciseDifficulty;
import com.gymduongdouble.backend.common.enums.Gender;
import com.gymduongdouble.backend.common.enums.GoalType;
import com.gymduongdouble.backend.common.enums.MemberSource;
import com.gymduongdouble.backend.common.enums.MembershipStatus;
import com.gymduongdouble.backend.common.enums.PaymentMethod;
import com.gymduongdouble.backend.common.enums.PlanType;
import com.gymduongdouble.backend.common.enums.ProgramStatus;
import com.gymduongdouble.backend.common.enums.PtAssignmentStatus;
import com.gymduongdouble.backend.common.enums.PtLevel;
import com.gymduongdouble.backend.common.enums.PtSessionStatus;
import com.gymduongdouble.backend.common.enums.RevenueCategory;
import com.gymduongdouble.backend.common.enums.ScheduleStatus;
import com.gymduongdouble.backend.common.enums.SessionPackageStatus;
import com.gymduongdouble.backend.common.enums.UserStatus;
import com.gymduongdouble.backend.common.repository.SystemSettingRepository;
import com.gymduongdouble.backend.exercise.domain.Exercise;
import com.gymduongdouble.backend.exercise.domain.ExerciseCategory;
import com.gymduongdouble.backend.exercise.repository.ExerciseCategoryRepository;
import com.gymduongdouble.backend.exercise.repository.ExerciseRepository;
import com.gymduongdouble.backend.finance.domain.DebtRecord;
import com.gymduongdouble.backend.finance.domain.Payment;
import com.gymduongdouble.backend.finance.repository.DebtRecordRepository;
import com.gymduongdouble.backend.finance.repository.PaymentRepository;
import com.gymduongdouble.backend.member.domain.Member;
import com.gymduongdouble.backend.member.repository.MemberRepository;
import com.gymduongdouble.backend.membership.domain.MemberMembership;
import com.gymduongdouble.backend.membership.domain.MembershipPlan;
import com.gymduongdouble.backend.membership.repository.MemberMembershipRepository;
import com.gymduongdouble.backend.membership.repository.MembershipPlanRepository;
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
import com.gymduongdouble.backend.training.domain.BodyMeasurement;
import com.gymduongdouble.backend.training.domain.PtGoal;
import com.gymduongdouble.backend.training.repository.BodyMeasurementRepository;
import com.gymduongdouble.backend.training.repository.PtGoalRepository;
import com.gymduongdouble.backend.user.domain.Role;
import com.gymduongdouble.backend.user.domain.User;
import com.gymduongdouble.backend.user.repository.RoleRepository;
import com.gymduongdouble.backend.user.repository.UserRepository;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private static final String UTF8_REPAIR_MARKER = "system.utf8_repair.v1";

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final SystemSettingRepository systemSettingRepository;
    private final MembershipPlanRepository membershipPlanRepository;
    private final MemberRepository memberRepository;
    private final MemberMembershipRepository memberMembershipRepository;
    private final DebtRecordRepository debtRecordRepository;
    private final PaymentRepository paymentRepository;
    private final PtProfileRepository ptProfileRepository;
    private final PtAssignmentRepository ptAssignmentRepository;
    private final PtSessionPackageRepository ptSessionPackageRepository;
    private final PtSessionLogRepository ptSessionLogRepository;
    private final PtScheduleRepository ptScheduleRepository;
    private final MemberActivityLogRepository memberActivityLogRepository;
    private final BodyMeasurementRepository bodyMeasurementRepository;
    private final PtGoalRepository ptGoalRepository;
    private final ExerciseCategoryRepository exerciseCategoryRepository;
    private final ExerciseRepository exerciseRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.owner.email}")
    private String ownerEmail;

    @Value("${app.seed.owner.password}")
    private String ownerPassword;

    @Value("${app.seed.owner.full-name}")
    private String ownerFullName;

    @Value("${app.seed.owner.phone}")
    private String ownerPhone;

    @Value("${app.seed.demo.enabled}")
    private boolean demoSeedEnabled;

    @Value("${app.seed.demo.member-password}")
    private String demoMemberPassword;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        seedRoles();
        repairLegacyMojibakeOnce();
        User owner = seedOwner();
        seedSystemSettings();
        seedMembershipPlans();

        if (demoSeedEnabled && seedDemoData(owner)) {
            seedAiAdvisorDemoMembers(owner);
            seedDemoMemberLogin();
        }
    }

    private void seedRoles() {
        createRoleIfMissing("OWNER", "Chủ phòng");
        createRoleIfMissing("PT", "Huấn luyện viên cá nhân");
        createRoleIfMissing("MEMBER", "Hội viên");
    }

    private void repairLegacyMojibakeOnce() {
        if (systemSettingRepository.existsById(UTF8_REPAIR_MARKER)) {
            return;
        }

        userRepository.findAll().forEach(user -> user.setFullName(repairText(user.getFullName())));
        memberRepository.findAll().forEach(member -> {
            member.setFullName(repairText(member.getFullName()));
            member.setAddress(repairText(member.getAddress()));
            member.setNote(repairText(member.getNote()));
        });
        membershipPlanRepository.findAll().forEach(plan -> {
            plan.setName(repairText(plan.getName()));
            plan.setDescription(repairText(plan.getDescription()));
        });
        ptProfileRepository.findAll().forEach(profile -> {
            profile.setSpecialty(repairText(profile.getSpecialty()));
            profile.setBio(repairText(profile.getBio()));
        });
        systemSettingRepository.findAll().forEach(setting -> {
            setting.setValue(repairText(setting.getValue()));
            setting.setDescription(repairText(setting.getDescription()));
        });
        exerciseCategoryRepository.findAll().forEach(category -> {
            category.setName(repairText(category.getName()));
            category.setDescription(repairText(category.getDescription()));
        });
        exerciseRepository.findAll().forEach(exercise -> {
            exercise.setName(repairText(exercise.getName()));
            exercise.setDescription(repairText(exercise.getDescription()));
            exercise.setInstruction(repairText(exercise.getInstruction()));
            exercise.setCommonMistakes(repairText(exercise.getCommonMistakes()));
            exercise.setPrimaryMuscle(repairText(exercise.getPrimaryMuscle()));
            exercise.setEquipment(repairText(exercise.getEquipment()));
        });
        memberMembershipRepository.findAll().forEach(membership -> membership.setNote(repairText(membership.getNote())));
        debtRecordRepository.findAll().forEach(debt -> debt.setNote(repairText(debt.getNote())));
        paymentRepository.findAll().forEach(payment -> payment.setDescription(repairText(payment.getDescription())));
        ptAssignmentRepository.findAll().forEach(assignment -> assignment.setNote(repairText(assignment.getNote())));
        ptScheduleRepository.findAll().forEach(schedule -> schedule.setNote(repairText(schedule.getNote())));
        ptSessionLogRepository.findAll().forEach(log -> {
            log.setContent(repairText(log.getContent()));
            log.setNote(repairText(log.getNote()));
        });
        memberActivityLogRepository.findAll().forEach(log -> log.setNote(repairText(log.getNote())));
        bodyMeasurementRepository.findAll().forEach(measurement -> measurement.setNote(repairText(measurement.getNote())));
        ptGoalRepository.findAll().forEach(goal -> {
            goal.setGoalDescription(repairText(goal.getGoalDescription()));
            goal.setNote(repairText(goal.getNote()));
        });

        SystemSetting marker = new SystemSetting();
        marker.setKey(UTF8_REPAIR_MARKER);
        marker.setValue("completed");
        marker.setDescription("Đã hoàn tất sửa dữ liệu tiếng Việt lỗi mã hóa cũ");
        marker.setUpdatedAt(Instant.now());
        systemSettingRepository.save(marker);
    }

    private Role createRoleIfMissing(String code, String name) {
        return roleRepository.findByCode(code).orElseGet(() -> {
            Role role = new Role();
            role.setCode(code);
            role.setName(name);
            return roleRepository.save(role);
        });
    }

    private User seedOwner() {
        if (!StringUtils.hasText(ownerEmail) || !StringUtils.hasText(ownerPassword)) {
            throw new IllegalStateException("Owner seed email/password must not be blank.");
        }

        Role ownerRole = roleRepository.findByCode("OWNER")
            .orElseThrow(() -> new IllegalStateException("OWNER role is missing."));
        Role ptRole = roleRepository.findByCode("PT")
            .orElseThrow(() -> new IllegalStateException("PT role is missing."));

        User owner = userRepository.findByEmail(ownerEmail).orElseGet(User::new);
        boolean newOwner = owner.getId() == null;
        if (newOwner) {
            owner.setEmail(ownerEmail);
            owner.setPasswordHash(passwordEncoder.encode(ownerPassword));
            owner.setFullName(ownerFullName);
            owner.setPhone(StringUtils.hasText(ownerPhone) ? ownerPhone : null);
            owner.setStatus(UserStatus.ACTIVE);
        } else if (!StringUtils.hasText(owner.getPasswordHash())) {
            owner.setPasswordHash(passwordEncoder.encode(ownerPassword));
        }
        owner.getRoles().add(ownerRole);
        owner.getRoles().add(ptRole);
        User savedOwner = userRepository.save(owner);
        createPtProfileIfMissing(
            savedOwner,
            PtLevel.MAIN,
            "Chu phong kiem huan luyen vien",
            "Phu trach van hanh va huan luyen ca nhan."
        );
        return savedOwner;
    }

    private void seedSystemSettings() {
        createSettingIfMissing("payment.vietqr.enabled", "true", "Bật/tắt hiển thị VietQR khi thu tiền");
        createSettingIfMissing("payment.vietqr.bank_code", "BIDV", "Mã ngân hàng VietQR");
        createSettingIfMissing("payment.vietqr.bank_name", "BIDV - Đầu tư & Phát triển VN", "Tên ngân hàng nhận tiền");
        createSettingIfMissing("payment.vietqr.account_number", "8847370686", "Số tài khoản nhận tiền");
        createSettingIfMissing("payment.vietqr.account_name", "HO KINH DOANH DUONG DOUBLE", "Tên chủ tài khoản nhận tiền");
        createSettingIfMissing("payment.vietqr.transfer_prefix", "GYMDD", "Tiền tố nội dung chuyển khoản");
        createSettingIfMissing("payment.vietqr.template", "compact2", "Mẫu hiển thị QR của VietQR");
    }

    private void createSettingIfMissing(String key, String value, String description) {
        systemSettingRepository.findById(key).orElseGet(() -> {
            SystemSetting setting = new SystemSetting();
            setting.setKey(key);
            setting.setValue(value);
            setting.setDescription(description);
            setting.setUpdatedAt(Instant.now());
            return systemSettingRepository.save(setting);
        });
    }

    private boolean seedDemoData(User owner) {
        if (memberRepository.count() > 0) {
            return false;
        }

        Role ptRole = roleRepository.findByCode("PT").orElseThrow();

        User ptKiet = createUser("kiet.pt@gymduongdouble.local", "Kiệt PT", "0901000099", ptRole);
        User ptTien = createUser("tien.pt@gymduongdouble.local", "Tiên PT", "0901000097", ptRole);

        seedPtProfiles(ptKiet, ptTien);

        Map<String, MembershipPlan> plans = seedMembershipPlans();
        LocalDate today = LocalDate.now();
        Member an = createMember("Nguyễn Văn An", "0901000001", LocalDate.of(1998, 5, 10), Gender.MALE, MemberSource.WALK_IN, "Khách tự tập ổn định.");
        Member binh = createMember("Trần Thị Bình", "0901000002", LocalDate.of(1999, 9, 30), Gender.FEMALE, MemberSource.FACEBOOK, "Sắp hết hạn, cần gọi chăm sóc.");
        Member cuong = createMember("Lê Quốc Cường", "0901000003", LocalDate.of(1994, 12, 3), Gender.MALE, MemberSource.ZALO, "Đã hết hạn, đang cân nhắc gia hạn.");
        Member duy = createMember("Phạm Minh Duy", "0901000004", LocalDate.of(2000, 2, 18), Gender.MALE, MemberSource.REFERRAL, "Khách PT chính, đang còn công nợ.");
        Member han = createMember("Hoàng Gia Hân", "0901000005", LocalDate.of(2002, 7, 22), Gender.FEMALE, MemberSource.WALK_IN, "Khách PT mới, tiến độ tốt.");
        Member lan = createMember("Võ Thanh Lan", "0901000006", LocalDate.of(1997, 10, 5), Gender.FEMALE, MemberSource.OTHER, "Khách giáo án/hướng dẫn.");

        MemberMembership anMembership = createMembership(an, plans.get("SELF_2M"), owner, today.minusDays(12), today.plusDays(48), bd("560000"), bd("560000"), bd("0"), MembershipStatus.ACTIVE, "Gói tự tập đang còn hạn.");
        MemberMembership binhMembership = createMembership(binh, plans.get("SELF_1M"), owner, today.minusDays(25), today.plusDays(5), bd("300000"), bd("300000"), bd("0"), MembershipStatus.ACTIVE, "Cảnh báo sắp hết hạn.");
        MemberMembership cuongMembership = createMembership(cuong, plans.get("SELF_1M"), owner, today.minusDays(45), today.minusDays(15), bd("300000"), bd("300000"), bd("0"), MembershipStatus.EXPIRED, "Khách đã hết hạn.");
        MemberMembership duyMembership = createMembership(duy, plans.get("PT_MAIN_20"), owner, today.minusDays(9), today.plusDays(51), bd("6000000"), bd("2000000"), bd("4000000"), MembershipStatus.ACTIVE, "Đã đóng trước một phần gói PT chính.");
        MemberMembership hanMembership = createMembership(han, plans.get("PT_NEW_20"), ptKiet, today.minusDays(20), today.plusDays(40), bd("3900000"), bd("3900000"), bd("0"), MembershipStatus.ACTIVE, "Gói PT mới 65% PT chính.");
        MemberMembership lanMembership = createMembership(lan, plans.get("GUIDANCE_30"), owner, today.minusDays(8), today.plusDays(82), bd("900000"), bd("900000"), bd("0"), MembershipStatus.ACTIVE, "Khách giáo án 30 buổi.");

        createOpenDebt(duy, duyMembership, bd("6000000"), bd("2000000"), bd("4000000"), today.plusDays(7), "Còn nợ phần còn lại gói PT chính 20 buổi.");
        createPayment(an, anMembership, null, today, bd("560000"), PaymentMethod.CASH, RevenueCategory.SELF_TRAINING, "Thu đủ gói tự tập 2 tháng.", owner);
        createPayment(binh, binhMembership, null, today, bd("300000"), PaymentMethod.BANK_TRANSFER, RevenueCategory.SELF_TRAINING, "Thu đủ gói tự tập 1 tháng.", owner);
        createPayment(cuong, cuongMembership, null, today, bd("300000"), PaymentMethod.CASH, RevenueCategory.SELF_TRAINING, "Thu gói tự tập đã hết hạn.", owner);
        createPayment(duy, duyMembership, null, today, bd("2000000"), PaymentMethod.BANK_TRANSFER, RevenueCategory.PT_MAIN, "Đóng trước gói PT chính.", owner);
        createPayment(han, hanMembership, null, today, bd("3900000"), PaymentMethod.BANK_TRANSFER, RevenueCategory.PT_NEW, "Thu đủ gói PT mới.", ptKiet);
        createPayment(lan, lanMembership, null, today, bd("900000"), PaymentMethod.CASH, RevenueCategory.GUIDANCE, "Thu gói giáo án/hướng dẫn.", owner);

        PtSessionPackage duyPackage = createPtPackage(duy, ptTien, duyMembership, 20, 4, 20, 2, today.minusDays(9), today.plusDays(51), SessionPackageStatus.ACTIVE);
        PtSessionPackage hanPackage = createPtPackage(han, ptKiet, hanMembership, 20, 8, 20, 5, today.minusDays(20), today.plusDays(40), SessionPackageStatus.ACTIVE);

        createPtAssignment(duy, ptTien, today.minusDays(9), duyPackage.getEndDate(), "PT chính theo gói 20 + 20.");
        createPtAssignment(han, ptKiet, today.minusDays(20), hanPackage.getEndDate(), "PT mới phụ trách gói 65%.");

        createSchedule(ptTien, duy, today.plusDays(1), LocalTime.of(17, 0), LocalTime.of(18, 0), ScheduleStatus.SCHEDULED, "Buổi PT thân trên.");
        createSchedule(ptKiet, han, today.plusDays(1), LocalTime.of(18, 0), LocalTime.of(19, 0), ScheduleStatus.SCHEDULED, "Buổi PT chân - mông.");
        createSchedule(ptTien, duy, today.minusDays(2), LocalTime.of(17, 0), LocalTime.of(18, 0), ScheduleStatus.COMPLETED, "Đã tập đủ.");

        createSessionLog(duyPackage, duy, ptTien, today.minusDays(7), 1, bd("74.5"), PtSessionStatus.COMPLETED, "Squat, bench press, lat pulldown.", "Form ổn, cần tăng đều mức tạ.");
        createSessionLog(duyPackage, duy, ptTien, today.minusDays(4), 2, bd("74.2"), PtSessionStatus.COMPLETED, "Deadlift nhẹ, shoulder press, plank.", "Còn yếu core.");
        createSessionLog(hanPackage, han, ptKiet, today.minusDays(18), 1, bd("56.4"), PtSessionStatus.COMPLETED, "Máy đùi, hip thrust, cardio nhẹ.", "Tiếp thu tốt.");
        createSessionLog(hanPackage, han, ptKiet, today.minusDays(15), 2, bd("56.1"), PtSessionStatus.COMPLETED, "Lưng xô, tay trước, bụng.", "Cần kiểm soát nhịp thở.");

        createActivityLog(lan, lanMembership, null, ActivityType.GUIDANCE_CHECKIN, today.minusDays(6), 1, null, "Check-in buổi giáo án số 1.", owner);
        createActivityLog(lan, lanMembership, null, ActivityType.GUIDANCE_CHECKIN, today.minusDays(3), 2, null, "Check-in buổi giáo án số 2.", owner);
        createActivityLog(duy, duyMembership, duyPackage, ActivityType.PRACTICE, today.minusDays(5), 1, bd("74.2"), "Buổi ôn tập sau PT.", ptTien);

        createBodyMeasurement(duy, ptTien, today.minusDays(9), bd("173"), bd("75.0"), bd("94"), bd("86"), bd("89"), bd("96"), bd("55"), bd("31"), "Chỉ số đầu vào.");
        createBodyMeasurement(duy, ptTien, today.minusDays(1), bd("173"), bd("74.2"), bd("94"), bd("84"), bd("87"), bd("96"), bd("55"), bd("31"), "Eo giảm nhẹ, cần duy trì.");
        createBodyMeasurement(han, ptKiet, today.minusDays(20), bd("160"), bd("56.7"), bd("86"), bd("72"), bd("75"), bd("92"), bd("51"), bd("27"), "Chỉ số đầu vào.");
        createBodyMeasurement(han, ptKiet, today.minusDays(2), bd("160"), bd("56.1"), bd("86"), bd("70"), bd("73"), bd("92"), bd("51"), bd("27"), "Tiến độ tốt.");

        createGoal(duy, ptTien, GoalType.FAT_LOSS, "Giảm mỡ, siết eo và tăng sức bền.", today.minusDays(9), today.plusDays(51), bd("70"), null, bd("80"), ProgramStatus.ACTIVE);
        createGoal(han, ptKiet, GoalType.MUSCLE_GAIN, "Tăng cơ mông đùi, cải thiện form squat.", today.minusDays(20), today.plusDays(40), bd("57"), null, bd("68"), ProgramStatus.ACTIVE);


        seedExercises();
        return true;
    }

    private User createUser(String email, String fullName, String phone, Role role) {
        User user = userRepository.findByEmail(email).orElseGet(User::new);
        user.setEmail(email);
        user.setFullName(fullName);
        user.setPhone(phone);
        user.setPasswordHash(passwordEncoder.encode(ownerPassword));
        user.setStatus(UserStatus.ACTIVE);
        user.getRoles().clear();
        user.getRoles().add(role);
        return userRepository.save(user);
    }

    private void seedDemoMemberLogin() {
        Role memberRole = roleRepository.findByCode("MEMBER").orElseThrow();
        memberRepository.findByPhone("0901000004").ifPresent(member -> {
            User memberUser = userRepository.findByEmail("duy.member@gymduongdouble.local").orElseGet(() -> {
                User user = new User();
                user.setEmail("duy.member@gymduongdouble.local");
                user.setPasswordHash(passwordEncoder.encode(demoMemberPassword));
                return user;
            });
            memberUser.setFullName(member.getFullName());
            memberUser.setPhone(member.getPhone());
            memberUser.setStatus(UserStatus.ACTIVE);
            memberUser.getRoles().clear();
            memberUser.getRoles().add(memberRole);
            User savedUser = userRepository.save(memberUser);
            if (member.getUser() == null || member.getUser().getId().equals(savedUser.getId())) {
                member.setUser(savedUser);
                memberRepository.save(member);
            }
        });
    }

    private void seedAiAdvisorDemoMembers(User owner) {
        if (memberRepository.findByPhone("0901100001").isPresent()) {
            return;
        }

        Map<String, MembershipPlan> plans = seedMembershipPlans();
        LocalDate today = LocalDate.now();
        User ptKiet = userRepository.findByEmail("kiet.pt@gymduongdouble.local").orElse(owner);
        User ptTien = userRepository.findByEmail("tien.pt@gymduongdouble.local").orElse(owner);

        Member mai = createMember("Mai Anh", "0901100001", LocalDate.of(2001, 3, 12), Gender.FEMALE, MemberSource.FACEBOOK, "Khách tự tập gói đầu tiên, sắp hết hạn.");
        Member bao = createMember("Quốc Bảo", "0901100002", LocalDate.of(1996, 6, 24), Gender.MALE, MemberSource.ZALO, "Khách tự tập đã hết hạn hơn 1 tuần.");
        Member khoa = createMember("Minh Khoa", "0901100003", LocalDate.of(1995, 11, 8), Gender.MALE, MemberSource.REFERRAL, "Khách PT gần hết hạn nhưng còn nhiều buổi.");
        Member ha = createMember("Thu Hà", "0901100004", LocalDate.of(1999, 1, 20), Gender.FEMALE, MemberSource.WALK_IN, "Khách PT bị gián đoạn lịch tập lâu ngày.");
        Member ngoc = createMember("Bích Ngọc", "0901100005", LocalDate.of(1998, 8, 17), Gender.FEMALE, MemberSource.FACEBOOK, "Khách cổ vai gáy sắp cần chăm sóc lại.");
        Member nam = createMember("Văn Nam", "0901100006", LocalDate.of(1993, 4, 2), Gender.MALE, MemberSource.OTHER, "Khách VIP tự tập đang duy trì tốt.");
        Member phuc = createMember("Đức Phúc", "0901100007", LocalDate.of(2000, 12, 10), Gender.MALE, MemberSource.WALK_IN, "Khách mới tháng này.");

        MemberMembership maiMembership = createMembership(mai, plans.get("SELF_1M"), owner, today.minusDays(27), today.plusDays(3), bd("300000"), bd("300000"), bd("0"), MembershipStatus.ACTIVE, "Gói đầu tiên sắp hết hạn.");
        MemberMembership baoMembership = createMembership(bao, plans.get("SELF_2M"), owner, today.minusDays(72), today.minusDays(12), bd("560000"), bd("560000"), bd("0"), MembershipStatus.EXPIRED, "Đã hết hạn, cần chăm sóc quay lại.");
        MemberMembership khoaMembership = createMembership(khoa, plans.get("PT_MAIN_20"), owner, today.minusDays(55), today.plusDays(5), bd("6000000"), bd("4000000"), bd("2000000"), MembershipStatus.ACTIVE, "Gần hết hạn, còn nhiều buổi PT.");
        MemberMembership haMembership = createMembership(ha, plans.get("PT_NEW_20"), ptKiet, today.minusDays(46), today.plusDays(14), bd("3900000"), bd("3900000"), bd("0"), MembershipStatus.ACTIVE, "Khách PT mới bị gián đoạn.");
        MemberMembership ngocMembership = createMembership(ngoc, plans.get("REHAB_5"), owner, today.minusDays(52), today.plusDays(8), bd("2550000"), bd("1550000"), bd("1000000"), MembershipStatus.ACTIVE, "Cổ vai gáy còn nợ một phần.");
        MemberMembership namMembership = createMembership(nam, plans.get("SELF_VIP_4M"), owner, today.minusDays(40), today.plusDays(80), bd("2080000"), bd("2080000"), bd("0"), MembershipStatus.ACTIVE, "Khách VIP ổn định.");
        MemberMembership phucMembership = createMembership(phuc, plans.get("SELF_2M"), owner, today.minusDays(3), today.plusDays(57), bd("560000"), bd("560000"), bd("0"), MembershipStatus.ACTIVE, "Khách mới tháng này.");

        createPayment(mai, maiMembership, null, today.minusDays(27), bd("300000"), PaymentMethod.BANK_TRANSFER, RevenueCategory.SELF_TRAINING, "Thu gói tự tập 1 tháng.", owner);
        createPayment(bao, baoMembership, null, today.minusDays(72), bd("560000"), PaymentMethod.CASH, RevenueCategory.SELF_TRAINING, "Thu gói tự tập 2 tháng.", owner);
        createPayment(khoa, khoaMembership, null, today.minusDays(55), bd("4000000"), PaymentMethod.BANK_TRANSFER, RevenueCategory.PT_MAIN, "Đóng trước gói PT chính.", owner);
        createPayment(ha, haMembership, null, today.minusDays(46), bd("3900000"), PaymentMethod.BANK_TRANSFER, RevenueCategory.PT_NEW, "Thu đủ gói PT mới.", ptKiet);
        createPayment(ngoc, ngocMembership, null, today.minusDays(52), bd("1550000"), PaymentMethod.CASH, RevenueCategory.GUIDANCE, "Đóng trước gói cổ vai gáy.", owner);
        createPayment(nam, namMembership, null, today.minusDays(40), bd("2080000"), PaymentMethod.BANK_TRANSFER, RevenueCategory.SELF_TRAINING, "Thu gói VIP 4 tháng.", owner);
        createPayment(phuc, phucMembership, null, today.minusDays(3), bd("560000"), PaymentMethod.CASH, RevenueCategory.SELF_TRAINING, "Thu gói tự tập khách mới.", owner);

        createOpenDebt(khoa, khoaMembership, bd("6000000"), bd("4000000"), bd("2000000"), today.plusDays(2), "Còn nợ phần sau của gói PT chính.");
        createOpenDebt(ngoc, ngocMembership, bd("2550000"), bd("1550000"), bd("1000000"), today.plusDays(5), "Còn nợ gói cổ vai gáy.");

        PtSessionPackage khoaPackage = createPtPackage(khoa, ptTien, khoaMembership, 20, 6, 20, 4, today.minusDays(55), today.plusDays(5), SessionPackageStatus.ACTIVE);
        PtSessionPackage haPackage = createPtPackage(ha, ptKiet, haMembership, 20, 5, 20, 3, today.minusDays(46), today.plusDays(14), SessionPackageStatus.ACTIVE);

        createPtAssignment(khoa, ptTien, today.minusDays(55), khoaPackage.getEndDate(), "Cần phục hồi lịch PT trước khi hết hạn.");
        createPtAssignment(ha, ptKiet, today.minusDays(46), haPackage.getEndDate(), "Khách PT mới cần kéo lại nhịp tập.");

        createSessionLog(khoaPackage, khoa, ptTien, today.minusDays(52), 1, bd("81.0"), PtSessionStatus.COMPLETED, "Đánh giá form squat, push, pull.", "Khởi đầu tốt.");
        createSessionLog(khoaPackage, khoa, ptTien, today.minusDays(40), 2, bd("80.4"), PtSessionStatus.COMPLETED, "Upper body strength.", "Cần đều lịch hơn.");
        createSessionLog(khoaPackage, khoa, ptTien, today.minusDays(22), 3, bd("79.8"), PtSessionStatus.COMPLETED, "Lower body, core.", "Sau đó nghỉ dài.");
        createSessionLog(haPackage, ha, ptKiet, today.minusDays(44), 1, bd("61.5"), PtSessionStatus.COMPLETED, "Full body nhẹ.", "Khách còn ngại tập tạ.");
        createSessionLog(haPackage, ha, ptKiet, today.minusDays(32), 2, bd("61.1"), PtSessionStatus.COMPLETED, "Máy đùi, hip thrust.", "Gián đoạn sau buổi này.");

        createActivityLog(khoa, khoaMembership, khoaPackage, ActivityType.PRACTICE, today.minusDays(38), 1, bd("80.2"), "Tự ôn buổi 1.", ptTien);
        createActivityLog(khoa, khoaMembership, khoaPackage, ActivityType.PRACTICE, today.minusDays(24), 2, bd("79.9"), "Tự ôn buổi 2.", ptTien);
        createActivityLog(ngoc, ngocMembership, null, ActivityType.GUIDANCE_CHECKIN, today.minusDays(14), 1, null, "Check cổ vai gáy buổi 1.", owner);

        seedAdvisorMeasurements(khoa, ptTien, today.minusDays(55), bd("175"), List.of(bd("81.0"), bd("80.4"), bd("79.8"), bd("79.5")), List.of(bd("92"), bd("90"), bd("88"), bd("87")));
        seedAdvisorMeasurements(ha, ptKiet, today.minusDays(46), bd("162"), List.of(bd("61.5"), bd("61.1"), bd("60.9"), bd("61.0")), List.of(bd("78"), bd("76"), bd("75"), bd("75")));

        createGoal(khoa, ptTien, GoalType.FAT_LOSS, "Giảm mỡ bụng, tăng sức bền và giữ lịch PT đều.", today.minusDays(55), today.plusDays(5), bd("76"), null, bd("84"), ProgramStatus.ACTIVE);
        createGoal(ha, ptKiet, GoalType.MUSCLE_GAIN, "Tăng cơ mông đùi, cải thiện sự tự tin khi tập tạ.", today.minusDays(46), today.plusDays(14), bd("62"), null, bd("72"), ProgramStatus.ACTIVE);
    }

    private void seedAdvisorMeasurements(Member member, User recordedBy, LocalDate startDate, BigDecimal height, List<BigDecimal> weights, List<BigDecimal> waists) {
        for (int index = 0; index < weights.size(); index += 1) {
            createBodyMeasurement(
                member,
                recordedBy,
                startDate.plusDays(index * 14L),
                height,
                weights.get(index),
                bd("94"),
                waists.get(index),
                waists.get(index).add(bd("3")),
                bd("96"),
                bd("55"),
                bd("31"),
                "Chỉ số demo phục vụ kiểm thử AI retention."
            );
        }
    }

    private void seedPtProfiles(User ptKiet, User ptTien) {
        createPtProfileIfMissing(ptKiet, PtLevel.NEW, "Tăng cơ - giảm mỡ cơ bản", "PT mới đã học việc xong, phụ trách gói PT cá nhân.");
        createPtProfileIfMissing(ptTien, PtLevel.MAIN, "Anatomy - phục hồi - hiệu suất", "PT chính/marketing, phụ trách khách cần theo sát tiến độ.");
    }

    private void createPtProfileIfMissing(User user, PtLevel level, String specialty, String bio) {
        ptProfileRepository.findByUserId(user.getId()).orElseGet(() -> {
            PtProfile profile = new PtProfile();
            profile.setUser(user);
            profile.setPtLevel(level);
            profile.setSpecialty(specialty);
            profile.setBio(bio);
            profile.setActive(true);
            return ptProfileRepository.save(profile);
        });
    }

    private Map<String, MembershipPlan> seedMembershipPlans() {
        List<SeedPlan> seedPlans = List.of(
            new SeedPlan("SELF_1M", "Tự Tập - Full 1 Tháng", "Gói tự tập 1 tháng", PlanType.SELF_TRAINING, null, 30, bd("300000"), null, null, null, "Không giới hạn số buổi trong tháng, hỗ trợ kĩ thuật máy móc ban đầu, tư vấn \"Tập Luyện và Dinh Dưỡng\" vào cuối tuần."),
            new SeedPlan("SELF_2M", "Tự Tập - Full 2 Tháng", "Gói tự tập 2 tháng", PlanType.SELF_TRAINING, null, 60, bd("560000"), null, null, null, "Không giới hạn số buổi trong tháng, hỗ trợ kĩ thuật máy móc ban đầu, tư vấn \"Tập Luyện và Dinh Dưỡng\" vào cuối tuần."),
            new SeedPlan("SELF_4M", "Tự Tập - Full 4 Tháng", null, PlanType.SELF_TRAINING, null, 120, bd("1000000"), null, null, null, "Không giới hạn số buổi trong tháng, hỗ trợ kĩ thuật máy móc ban đầu, tư vấn \"Tập Luyện và Dinh Dưỡng\" vào cuối tuần."),
            new SeedPlan("SELF_6M", "Tự Tập - Full 6 Tháng", null, PlanType.SELF_TRAINING, null, 180, bd("1320000"), null, null, null, "Không giới hạn số buổi trong tháng, hỗ trợ kĩ thuật máy móc ban đầu, tư vấn \"Tập Luyện và Dinh Dưỡng\" vào cuối tuần."),
            new SeedPlan("SELF_VIP_1M", "Tự Tập VIP - Full 1 Tháng", null, PlanType.SELF_TRAINING, null, 30, bd("640000"), null, null, null, "Bao gồm Gói tự tập, sử dụng sổ \"Buổi Tập Mẫu\", tặng File/Sổ Theo Dõi Tập Luyện, tặng File \"Gym Căn Bản\"."),
            new SeedPlan("SELF_VIP_2M", "Tự Tập VIP - Full 2 Tháng", null, PlanType.SELF_TRAINING, null, 60, bd("1160000"), null, null, null, "Bao gồm Gói tự tập, sử dụng sổ \"Buổi Tập Mẫu\", tặng File/Sổ Theo Dõi Tập Luyện, tặng File \"Gym Căn Bản\"."),
            new SeedPlan("SELF_VIP_4M", "Tự Tập VIP - Full 4 Tháng", null, PlanType.SELF_TRAINING, null, 120, bd("2080000"), null, null, null, "Bao gồm Gói tự tập, sử dụng sổ \"Buổi Tập Mẫu\", tặng File/Sổ Theo Dõi Tập Luyện, tặng File \"Gym Căn Bản\"."),
            new SeedPlan("SELF_VIP_6M", "Tự Tập VIP - Full 6 Tháng", "Gói tự tập VIP 6 tháng", PlanType.SELF_TRAINING, null, 180, bd("2760000"), null, null, null, "Bao gồm Gói tự tập, sử dụng sổ \"Buổi Tập Mẫu\", tặng File/Sổ Theo Dõi Tập Luyện, tặng File \"Gym Căn Bản\"."),
            new SeedPlan("GUIDANCE_30", "Dạy Gym Cá Nhân - 12 PT + 12 Thực Nghiệm", "Gói giáo án 30 buổi", PlanType.PT, PtLevel.MAIN, 45, bd("5000000"), 12, 12, null, "Kèm 1 - 1, thực nghiệm thực tế, chuẩn hóa Kĩ Thuật Tập Luyện, hiểu từng nhóm cơ kích hoạt qua Anatomy, hiểu dinh dưỡng tự tính thực đơn, hiểu nền tảng xây dựng giáo án."),
            new SeedPlan("GUIDANCE_60", "Dạy Gym Cá Nhân - 24 PT + 24 Thực Nghiệm", "Gói giáo án 60 buổi", PlanType.PT, PtLevel.MAIN, 90, bd("9000000"), 24, 24, null, "Kèm 1 - 1, lộ trình chuyên sâu làm chủ kỹ thuật tạ nặng, thấu hiểu dinh dưỡng và lập kế hoạch tăng cơ giảm mỡ trọn đời."),
            new SeedPlan("PT_MAIN_20", "Tăng Cơ Giảm Mỡ (PT Chuẩn) - 2 Tháng (20 PT + 20 Hướng Dẫn)", "PT chính 20 PT + 20 ôn tập", PlanType.PT, PtLevel.MAIN, 60, bd("6000000"), 20, 20, null, "PT Chuẩn (Đầy đủ chứng chỉ, VĐV, >3 năm kinh nghiệm, nhiều Transform tốt). 20 PT + 20 Hướng Dẫn."),
            new SeedPlan("PT_MAIN_40", "Tăng Cơ Giảm Mỡ (PT Chuẩn) - 4 Tháng (40 PT + 40 Hướng Dẫn)", "PT chính 40 PT + 40 ôn tập", PlanType.PT, PtLevel.MAIN, 120, bd("11200000"), 40, 40, null, "PT Chuẩn. 40 PT + 40 Hướng Dẫn. Tặng 2 buổi Giãn Cơ Full Body."),
            new SeedPlan("PT_MAIN_60", "Tăng Cơ Giảm Mỡ (PT Chuẩn) - 6 Tháng (60 PT + 60 Hướng Dẫn)", null, PlanType.PT, PtLevel.MAIN, 180, bd("15600000"), 60, 60, null, "PT Chuẩn. 60 PT + 60 Hướng Dẫn. Tặng 4 buổi Giãn Cơ Full Body."),
            new SeedPlan("PT_NEW_20", "Tăng Cơ Giảm Mỡ (PT Mới Ra Nghề) - 2 Tháng", "PT mới 20 PT + 20 ôn tập", PlanType.PT, PtLevel.NEW, 60, bd("3900000"), 20, 20, null, "65% gói PT Chuẩn. 20 PT + 20 Hướng Dẫn."),
            new SeedPlan("PT_NEW_40", "Tăng Cơ Giảm Mỡ (PT Mới Ra Nghề) - 4 Tháng", null, PlanType.PT, PtLevel.NEW, 120, bd("7280000"), 40, 40, null, "65% gói PT Chuẩn. 40 PT + 40 Hướng Dẫn. Tặng 2 buổi Giãn Cơ Full Body."),
            new SeedPlan("PT_NEW_60", "Tăng Cơ Giảm Mỡ (PT Mới Ra Nghề) - 6 Tháng", null, PlanType.PT, PtLevel.NEW, 180, bd("10140000"), 60, 60, null, "65% gói PT Chuẩn. 60 PT + 60 Hướng Dẫn. Tặng 4 buổi Giãn Cơ Full Body."),
            new SeedPlan("SPORT_45", "Hiệu Suất Thể Thao - 1,5 Tháng (10 Kĩ Thuật + 10 Thể Lực)", null, PlanType.PT, PtLevel.MAIN, 45, bd("3000000"), 10, 10, null, "Tăng sức mạnh, cải thiện thể lực, tăng tốc độ, nâng cao phản xạ, tăng sức bền, tối ưu vận động, phục hồi tốt hơn, cá nhân hóa theo mục tiêu riêng."),
            new SeedPlan("SPORT_90", "Hiệu Suất Thể Thao - 3 Tháng (20 Kĩ Thuật + 20 Thể Lực)", null, PlanType.PT, PtLevel.MAIN, 90, bd("5600000"), 20, 20, null, "Tặng 1 buổi Giãn Cơ Full Body. Tăng sức mạnh, cải thiện thể lực, tăng tốc độ, nâng cao phản xạ, tăng sức bền, tối ưu vận động, phục hồi tốt hơn."),
            new SeedPlan("REHAB_1", "Văn Phòng Cổ Vai Gáy - 1 Trị Liệu + 3 Hướng Dẫn", null, PlanType.GUIDANCE, null, 15, bd("560000"), null, null, 4, "Giảm đau mỏi cổ, vai, gáy. Cải thiện tư thế, tăng độ linh hoạt, thả lỏng cơ, tăng sức mạnh cổ và lưng, ngừa tái phát."),
            new SeedPlan("REHAB_5", "Văn Phòng Cổ Vai Gáy - 5 Trị Liệu + 15 Hướng Dẫn", null, PlanType.GUIDANCE, null, 60, bd("2550000"), null, null, 20, "Giảm đau mỏi cổ, vai, gáy. Cải thiện tư thế, tăng độ linh hoạt, thả lỏng cơ, tăng sức mạnh cổ và lưng, ngừa tái phát."),
            new SeedPlan("REHAB_10", "Văn Phòng Cổ Vai Gáy - 10 Trị Liệu + 30 Hướng Dẫn", null, PlanType.GUIDANCE, null, 120, bd("4600000"), null, null, 40, "Giảm đau mỏi cổ, vai, gáy. Cải thiện tư thế, tăng độ linh hoạt, thả lỏng cơ, tăng sức mạnh cổ và lưng, ngừa tái phát.")
        );

        List<MembershipPlan> existingPlans = membershipPlanRepository.findAll();
        Map<String, MembershipPlan> existingPlansByName = existingPlans.stream()
            .collect(Collectors.toMap(MembershipPlan::getName, Function.identity(), (first, second) -> first));

        Map<String, MembershipPlan> seededPlans = seedPlans.stream().collect(Collectors.toMap(SeedPlan::code, plan -> {
            MembershipPlan entity = existingPlansByName.get(plan.name());
            if (entity == null && StringUtils.hasText(plan.legacyName())) {
                entity = existingPlansByName.get(plan.legacyName());
            }
            if (entity == null) {
                entity = findExistingPlan(existingPlans, plan);
            }
            boolean isNewPlan = entity == null;
            if (entity == null) {
                entity = new MembershipPlan();
            }
            entity.setName(plan.name());
            entity.setPlanType(plan.planType());
            entity.setPtLevel(plan.ptLevel());
            entity.setDurationDays(plan.durationDays());
            entity.setDefaultPrice(plan.defaultPrice());
            entity.setPtSessionCount(plan.ptSessionCount());
            entity.setPracticeSessionCount(plan.practiceSessionCount());
            entity.setGuidanceSessionCount(plan.guidanceSessionCount());
            entity.setDescription(plan.description());
            if (isNewPlan) {
                entity.setActive(true);
            }
            MembershipPlan saved = membershipPlanRepository.save(entity);
            existingPlansByName.put(saved.getName(), saved);
            return saved;
        }));

        Set<Long> seededPlanIds = seededPlans.values().stream()
            .map(MembershipPlan::getId)
            .collect(Collectors.toSet());

        deleteLegacyCorruptedPlans(seededPlanIds);

        return seededPlans;
    }

    private void deleteLegacyCorruptedPlans(Set<Long> seededPlanIds) {
        membershipPlanRepository.findAll().stream()
            .filter(plan -> !seededPlanIds.contains(plan.getId()))
            .filter(plan -> !plan.isActive())
            .filter(plan -> looksLikeMojibake(plan.getName()))
            .filter(plan -> !memberMembershipRepository.existsByPlanId(plan.getId()))
            .forEach(membershipPlanRepository::delete);
    }

    private boolean looksLikeMojibake(String value) {
        if (!StringUtils.hasText(value)) {
            return false;
        }
        return value.indexOf('\u00c3') >= 0
            || value.indexOf('\u00c4') >= 0
            || value.indexOf('\u00c6') >= 0;
    }

    private String repairText(String value) {
        String repaired = value;
        for (int pass = 0; pass < 2 && looksLikeMojibake(repaired); pass += 1) {
            repaired = new String(repaired.getBytes(StandardCharsets.ISO_8859_1), StandardCharsets.UTF_8);
        }
        return repaired;
    }

    private MembershipPlan findExistingPlan(List<MembershipPlan> existingPlans, SeedPlan plan) {
        return existingPlans.stream()
            .filter(existing -> existing.getPlanType() == plan.planType())
            .filter(existing -> Objects.equals(existing.getPtLevel(), plan.ptLevel()))
            .filter(existing -> Objects.equals(existing.getDurationDays(), plan.durationDays()))
            .filter(existing -> sameMoney(existing.getDefaultPrice(), plan.defaultPrice()))
            .filter(existing -> Objects.equals(existing.getPtSessionCount(), plan.ptSessionCount()))
            .filter(existing -> Objects.equals(existing.getPracticeSessionCount(), plan.practiceSessionCount()))
            .filter(existing -> Objects.equals(existing.getGuidanceSessionCount(), plan.guidanceSessionCount()))
            .findFirst()
            .orElse(null);
    }

    private boolean sameMoney(BigDecimal left, BigDecimal right) {
        if (left == null || right == null) {
            return left == right;
        }
        return left.compareTo(right) == 0;
    }

    private Member createMember(String fullName, String phone, LocalDate birthday, Gender gender, MemberSource source, String note) {
        Member member = new Member();
        member.setFullName(fullName);
        member.setPhone(phone);
        member.setZaloPhone(phone);
        member.setDateOfBirth(birthday);
        member.setGender(gender);
        member.setAddress("Quy Nhơn Nam, Gia Lai");
        member.setSource(source);
        member.setNote(note);
        return memberRepository.save(member);
    }

    private MemberMembership createMembership(Member member, MembershipPlan plan, User soldBy, LocalDate start, LocalDate end, BigDecimal price, BigDecimal paid, BigDecimal debt, MembershipStatus status, String note) {
        MemberMembership membership = new MemberMembership();
        membership.setMember(member);
        membership.setPlan(plan);
        membership.setSoldByUser(soldBy);
        membership.setStartDate(start);
        membership.setEndDate(end);
        membership.setActualPrice(price);
        membership.setPaidAmount(paid);
        membership.setDebtAmount(debt);
        membership.setDiscountAmount(BigDecimal.ZERO);
        membership.setStatus(status);
        membership.setNote(note);
        membership.setCreatedBy(soldBy);
        return memberMembershipRepository.save(membership);
    }

    private DebtRecord createOpenDebt(Member member, MemberMembership membership, BigDecimal original, BigDecimal paid, BigDecimal remaining, LocalDate dueDate, String note) {
        DebtRecord debt = new DebtRecord();
        debt.setMember(member);
        debt.setMembership(membership);
        debt.setOriginalAmount(original);
        debt.setPaidAmount(paid);
        debt.setRemainingAmount(remaining);
        debt.setDueDate(dueDate);
        debt.setStatus(DebtStatus.PARTIALLY_PAID);
        debt.setNote(note);
        return debtRecordRepository.save(debt);
    }

    private Payment createPayment(Member member, MemberMembership membership, DebtRecord debt, LocalDate date, BigDecimal amount, PaymentMethod method, RevenueCategory revenueCategory, String description, User createdBy) {
        Payment payment = new Payment();
        payment.setMember(member);
        payment.setMembership(membership);
        payment.setDebtRecord(debt);
        payment.setPaymentDate(date);
        payment.setAmount(amount);
        payment.setPaymentMethod(method);
        payment.setRevenueCategory(revenueCategory);
        payment.setDescription(description);
        payment.setCreatedBy(createdBy);
        return paymentRepository.save(payment);
    }

    private PtSessionPackage createPtPackage(Member member, User ptUser, MemberMembership membership, int totalPt, int usedPt, int totalPractice, int usedPractice, LocalDate start, LocalDate end, SessionPackageStatus status) {
        PtSessionPackage sessionPackage = new PtSessionPackage();
        sessionPackage.setMember(member);
        sessionPackage.setPtUser(ptUser);
        sessionPackage.setMembership(membership);
        sessionPackage.setTotalPtSessions(totalPt);
        sessionPackage.setUsedPtSessions(usedPt);
        sessionPackage.setRemainingPtSessions(totalPt - usedPt);
        sessionPackage.setTotalPracticeSessions(totalPractice);
        sessionPackage.setUsedPracticeSessions(usedPractice);
        sessionPackage.setRemainingPracticeSessions(totalPractice - usedPractice);
        sessionPackage.setStartDate(start);
        sessionPackage.setEndDate(end);
        sessionPackage.setStatus(status);
        return ptSessionPackageRepository.save(sessionPackage);
    }

    private void createPtAssignment(Member member, User ptUser, LocalDate startDate, LocalDate endDate, String note) {
        PtAssignment assignment = new PtAssignment();
        assignment.setMember(member);
        assignment.setPtUser(ptUser);
        assignment.setStartDate(startDate);
        assignment.setEndDate(endDate);
        assignment.setStatus(PtAssignmentStatus.ACTIVE);
        assignment.setNote(note);
        ptAssignmentRepository.save(assignment);
    }

    private void createSchedule(User ptUser, Member member, LocalDate date, LocalTime start, LocalTime end, ScheduleStatus status, String note) {
        PtSchedule schedule = new PtSchedule();
        schedule.setPtUser(ptUser);
        schedule.setMember(member);
        schedule.setScheduleDate(date);
        schedule.setStartTime(start);
        schedule.setEndTime(end);
        schedule.setStatus(status);
        schedule.setNote(note);
        schedule.setCreatedBy(ptUser);
        ptScheduleRepository.save(schedule);
    }

    private void createSessionLog(PtSessionPackage sessionPackage, Member member, User ptUser, LocalDate date, int sessionNumber, BigDecimal weight, PtSessionStatus status, String content, String note) {
        PtSessionLog log = new PtSessionLog();
        log.setSessionPackage(sessionPackage);
        log.setMember(member);
        log.setPtUser(ptUser);
        log.setSessionDate(date);
        log.setSessionNumber(sessionNumber);
        log.setWeight(weight);
        log.setStatus(status);
        log.setContent(content);
        log.setNote(note);
        log.setCreatedBy(ptUser);
        ptSessionLogRepository.save(log);
    }

    private void createActivityLog(Member member, MemberMembership membership, PtSessionPackage sessionPackage, ActivityType type, LocalDate date, Integer sessionNumber, BigDecimal weight, String note, User createdBy) {
        MemberActivityLog log = new MemberActivityLog();
        log.setMember(member);
        log.setMembership(membership);
        log.setSessionPackage(sessionPackage);
        log.setActivityType(type);
        log.setActivityDate(date);
        log.setSessionNumber(sessionNumber);
        log.setWeight(weight);
        log.setNote(note);
        log.setCreatedBy(createdBy);
        memberActivityLogRepository.save(log);
    }

    private void createBodyMeasurement(Member member, User recordedBy, LocalDate date, BigDecimal height, BigDecimal weight, BigDecimal chest, BigDecimal waist, BigDecimal abdomen, BigDecimal hip, BigDecimal thigh, BigDecimal arm, String note) {
        BodyMeasurement measurement = new BodyMeasurement();
        measurement.setMember(member);
        measurement.setRecordedBy(recordedBy);
        measurement.setRecordedAt(date.atTime(7, 30).atZone(java.time.ZoneId.systemDefault()).toInstant());
        measurement.setHeight(height);
        measurement.setWeight(weight);
        measurement.setChest(chest);
        measurement.setWaist(waist);
        measurement.setAbdomen(abdomen);
        measurement.setHip(hip);
        measurement.setThigh(thigh);
        measurement.setArm(arm);
        measurement.setNote(note);
        bodyMeasurementRepository.save(measurement);
    }

    private void createGoal(Member member, User ptUser, GoalType type, String description, LocalDate start, LocalDate targetDate, BigDecimal targetWeight, BigDecimal targetBodyFat, BigDecimal targetWaist, ProgramStatus status) {
        PtGoal goal = new PtGoal();
        goal.setMember(member);
        goal.setPtUser(ptUser);
        goal.setGoalType(type);
        goal.setGoalDescription(description);
        goal.setStartDate(start);
        goal.setTargetDate(targetDate);
        goal.setTargetWeight(targetWeight);
        goal.setTargetBodyFat(targetBodyFat);
        goal.setTargetWaist(targetWaist);
        goal.setStatus(status);
        ptGoalRepository.save(goal);
    }

    private void seedExercises() {
        // Xóa sạch các bài tập mẫu giả lập cũ
        List<String> oldSlugs = List.of("bench-press-can-ban", "lat-pulldown-dung-form", "hip-thrust-tang-co-mong", "gian-co-vai-gay-van-phong");
        for (String oldSlug : oldSlugs) {
            exerciseRepository.findBySlug(oldSlug).ifPresent(exerciseRepository::delete);
        }

        // 6 Nhóm cơ cơ bản chuẩn hóa theo đúng yêu cầu chủ phòng
        ExerciseCategory chest = createExerciseCategory("Ngực", "nguc", "Các bài tập phát triển toàn diện cơ ngực.", "dumbbell", 1);
        ExerciseCategory back = createExerciseCategory("Lưng - Xô", "lung-xo", "Kéo xô, lưng xô, lưng giữa và lưng dưới.", "activity", 2);
        ExerciseCategory arms = createExerciseCategory("Tay", "tay", "Cơ tay trước (Biceps), tay sau (Triceps) và cẳng tay.", "dumbbell", 3);
        ExerciseCategory shoulders = createExerciseCategory("Vai", "vai", "Cơ vai trước, vai giữa và vai sau.", "zap", 4);
        ExerciseCategory legs = createExerciseCategory("Chân - Mông", "chan-mong", "Đùi trước, đùi sau, mông và bắp chân.", "flame", 5);
        ExerciseCategory rehab = createExerciseCategory("Cổ vai gáy", "co-vai-gay", "Các bài tập giãn và phục hồi cổ vai gáy.", "heart-pulse", 6);

        // Seed video bài tập chuẩn mẫu của chủ phòng
        createExercise(
            chest,
            "Giáo án cải thiện cơ Ngực hiệu quả",
            "giao-an-cai-thien-co-nguc-hieu-qua-leehuy",
            "Hướng dẫn kỹ thuật bài tập ngực chuẩn form giúp tăng cơ tối ưu từ TikTok HLV.",
            "Hạ thanh đòn/tạ kiểm soát chậm, ép chặt cơ ngực ở điểm cao nhất, tránh khóa khớp cùi chỏ.",
            "Cong thắt lưng quá đà hoặc rụt vai khi đẩy nặng.",
            ExerciseDifficulty.BEGINNER,
            "Ngực",
            "Tạ đòn / Ghế Bench Press",
            "https://www.tiktok.com/@leehuy2199/video/7685343591798983956",
            true
        );
    }

    private ExerciseCategory createExerciseCategory(String name, String slug, String description, String iconName, int sortOrder) {
        return exerciseCategoryRepository.findBySlug(slug).map(category -> {
            category.setName(name);
            category.setDescription(description);
            category.setSortOrder(sortOrder);
            category.setActive(true);
            return exerciseCategoryRepository.save(category);
        }).orElseGet(() -> {
            ExerciseCategory category = new ExerciseCategory();
            category.setName(name);
            category.setSlug(slug);
            category.setDescription(description);
            category.setIconName(iconName);
            category.setSortOrder(sortOrder);
            category.setActive(true);
            return exerciseCategoryRepository.save(category);
        });
    }

    private void createExercise(ExerciseCategory category, String name, String slug, String description, String instruction, String mistakes, ExerciseDifficulty difficulty, String primaryMuscle, String equipment, String tiktokUrl, boolean featured) {
        exerciseRepository.findBySlug(slug).orElseGet(() -> {
            Exercise exercise = new Exercise();
            exercise.setCategory(category);
            exercise.setName(name);
            exercise.setSlug(slug);
            exercise.setDescription(description);
            exercise.setInstruction(instruction);
            exercise.setCommonMistakes(mistakes);
            exercise.setDifficulty(difficulty);
            exercise.setPrimaryMuscle(primaryMuscle);
            exercise.setEquipment(equipment);
            exercise.setTiktokUrl(tiktokUrl);
            exercise.setTiktokVideoId(tiktokUrl.substring(tiktokUrl.lastIndexOf('/') + 1));
            exercise.setThumbnailUrl("https://placehold.co/640x360/111827/facc15?text=DUONG+DOUBLE");
            exercise.setFeatured(featured);
            exercise.setActive(true);
            return exerciseRepository.save(exercise);
        });
    }

    private BigDecimal bd(String value) {
        return new BigDecimal(value);
    }

    private record SeedPlan(
        String code,
        String name,
        String legacyName,
        PlanType planType,
        PtLevel ptLevel,
        Integer durationDays,
        BigDecimal defaultPrice,
        Integer ptSessionCount,
        Integer practiceSessionCount,
        Integer guidanceSessionCount,
        String description
    ) {
    }
}
