package com.gymduongdouble.backend.member.service;

import com.gymduongdouble.backend.common.enums.DebtStatus;
import com.gymduongdouble.backend.common.enums.MemberStatus;
import com.gymduongdouble.backend.common.enums.UserStatus;
import com.gymduongdouble.backend.common.exception.BadRequestException;
import com.gymduongdouble.backend.common.exception.ConflictException;
import com.gymduongdouble.backend.common.exception.ResourceNotFoundException;
import com.gymduongdouble.backend.common.security.AuthenticatedUser;
import com.gymduongdouble.backend.common.security.PasswordPolicy;
import com.gymduongdouble.backend.common.validation.VietnamPhoneNormalizer;
import com.gymduongdouble.backend.common.security.SecurityUtils;
import com.gymduongdouble.backend.common.time.AppClock;
import com.gymduongdouble.backend.common.web.dto.PageResponse;
import com.gymduongdouble.backend.finance.domain.DebtRecord;
import com.gymduongdouble.backend.finance.repository.DebtRecordRepository;
import com.gymduongdouble.backend.member.domain.Member;
import com.gymduongdouble.backend.member.repository.MemberRepository;
import com.gymduongdouble.backend.member.web.dto.MemberCreateRequest;
import com.gymduongdouble.backend.member.web.dto.MemberDetailResponse;
import com.gymduongdouble.backend.member.web.dto.MemberListFilter;
import com.gymduongdouble.backend.member.web.dto.MemberListStatisticsResponse;
import com.gymduongdouble.backend.member.web.dto.MemberResponse;
import com.gymduongdouble.backend.member.web.dto.MemberSummaryResponse;
import com.gymduongdouble.backend.member.web.dto.MemberUpdateRequest;
import com.gymduongdouble.backend.member.web.dto.PtSessionPackageResponse;
import com.gymduongdouble.backend.membership.domain.MemberMembership;
import com.gymduongdouble.backend.membership.repository.MemberMembershipRepository;
import com.gymduongdouble.backend.membership.service.MembershipLifecyclePolicy;
import com.gymduongdouble.backend.membership.web.dto.MemberMembershipResponse;
import com.gymduongdouble.backend.pt.repository.PtSessionPackageRepository;
import com.gymduongdouble.backend.user.domain.Role;
import com.gymduongdouble.backend.user.domain.User;
import com.gymduongdouble.backend.user.repository.RoleRepository;
import com.gymduongdouble.backend.user.repository.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class MemberService {

    private static final int EXPIRING_SOON_DAYS = 7;

    private final MemberRepository memberRepository;
    private final MemberMembershipRepository memberMembershipRepository;
    private final DebtRecordRepository debtRecordRepository;
    private final PtSessionPackageRepository ptSessionPackageRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordPolicy passwordPolicy;
    private final MemberAccessService memberAccessService;
    private final MembershipLifecyclePolicy membershipLifecyclePolicy;
    private final VietnamPhoneNormalizer phoneNormalizer;

    /**
     * [LUỒNG TẠO HỒ SƠ - BƯỚC 2: SERVICE XỬ LÝ NGHIỆP VỤ & BẢO VỆ DỮ LIỆU]:
     * 1. Chuẩn hóa SĐT và Zalo về dạng 10 số chuẩn qua VietnamPhoneNormalizer.
     * 2. Phòng thủ tầng ứng dụng: Kiểm tra trùng SĐT qua findByPhone -> Ném ConflictException (HTTP 409).
     * 3. Khởi tạo thực thể Member: Trim họ tên, fallback Zalo = SĐT chính nếu chưa nhập, gán ACTIVE.
     *    Lưu ý: user_id ban đầu luôn là null (hồ sơ khách mới chưa cấp tài khoản Portal).
     * 4. Lưu xuống PostgreSQL và trả về DTO MemberResponse an toàn.
     */
    @Transactional
    public MemberResponse create(MemberCreateRequest request) {
        // 2.1. Chuẩn hóa số điện thoại di động Việt Nam (chuyển đổi +84, bỏ dấu cách, kiểm tra regex 10 số)
        String normalizedPhone = phoneNormalizer.normalizeRequired(request.phone(), "Số điện thoại");
        String normalizedZaloPhone = phoneNormalizer.normalizeOptional(request.zaloPhone(), "Số Zalo");

        // 2.2. Kiểm tra trùng lặp số điện thoại (Tuyến phòng thủ tầng 1 - Application Layer)
        memberRepository.findByPhone(normalizedPhone).ifPresent(member -> {
            throw new ConflictException("Số điện thoại đã tồn tại trong hệ thống.");
        });

        // 2.3. Khởi tạo đối tượng Member
        Member member = new Member();
        member.setFullName(request.fullName().trim()); // Gọt sạch khoảng trắng thừa
        member.setPhone(normalizedPhone);
        member.setDateOfBirth(request.dateOfBirth());
        member.setGender(request.gender());
        member.setAddress(request.address());
        
        // Tự động gán số điện thoại chính làm số Zalo nếu khách không nhập riêng
        member.setZaloPhone(normalizedZaloPhone == null ? normalizedPhone : normalizedZaloPhone);
        member.setSource(request.source());
        member.setStatus(MemberStatus.ACTIVE); // Mặc định hồ sơ mới là ACTIVE
        member.setNote(request.note());

        // 2.4. Lưu vào DB và map sang DTO
        return MemberResponse.from(memberRepository.save(member));
    }

    @Transactional(readOnly = true)
    public MemberDetailResponse getDetail(Long id) {
        memberAccessService.ensureCanAccessMember(id);
        Member member = findEntity(id);
        LocalDate today = AppClock.today();
        List<MemberMembership> memberships = memberMembershipRepository.findByMemberIdOrderByStartDateDesc(id);

        List<MemberMembershipResponse> activeMemberships = memberships.stream()
            .filter(membership -> membershipLifecyclePolicy.isEffective(membership, today))
            .map(membership -> MemberMembershipResponse.from(
                membership,
                membershipLifecyclePolicy.effectiveStatus(membership, today)
            ))
            .toList();

        List<MemberMembershipResponse> membershipHistory = memberships.stream()
            .filter(membership -> !membershipLifecyclePolicy.isEffective(membership, today))
            .map(membership -> MemberMembershipResponse.from(
                membership,
                membershipLifecyclePolicy.effectiveStatus(membership, today)
            ))
            .toList();

        List<PtSessionPackageResponse> ptSessionPackages = ptSessionPackageRepository.findByMemberIdOrderByStartDateDesc(id).stream()
            .map(sessionPackage -> PtSessionPackageResponse.from(
                sessionPackage,
                membershipLifecyclePolicy.effectiveStatus(sessionPackage, today)
            ))
            .toList();

        return new MemberDetailResponse(
            MemberResponse.from(member),
            activeMemberships,
            membershipHistory,
            ptSessionPackages,
            totalDebt(id)
        );
    }

    /**
     * Cập nhật hồ sơ hội viên và đồng bộ tài khoản Portal (nếu có).
     *
     * [BẢO MẬT & KIẾN TRÚC]:
     * 1. Chống IDOR: memberAccessService.ensureCanAccessMember(id) đảm bảo PT chỉ sửa được học viên mình phụ trách.
     * 2. Chống lỗi "Tự trùng chính mình": memberRepository.existsByPhoneAndIdNot(phone, id) loại trừ chính ID đang sửa,
     *    tránh false-positive ConflictException khi người dùng bấm Lưu mà không đổi số điện thoại cũ.
     * 3. Phân cấp quyền đổi trạng thái (Privilege Escalation Defense): Chỉ OWNER mới có quyền thay đổi MemberStatus
     *    (ACTIVE, INACTIVE, ARCHIVED). PT cố tình thay đổi sẽ bị chặn bởi AccessDeniedException (HTTP 403).
     * 4. Đồng bộ 1 chiều (One-Way Safety Lock): syncPortalAccount sẽ tự động khóa Portal (LOCKED) nếu hội viên
     *    ngừng hoạt động, nhưng khi kích hoạt lại KHÔNG tự mở khóa để đảm bảo an toàn truy cập mạng.
     */
    @Transactional
    public MemberResponse update(Long id, MemberUpdateRequest request) {
        memberAccessService.ensureCanAccessMember(id);
        Member member = findEntity(id);
        String normalizedPhone = phoneNormalizer.normalizeRequired(request.phone(), "Số điện thoại");
        String normalizedZaloPhone = phoneNormalizer.normalizeOptional(request.zaloPhone(), "Số Zalo");

        // Loại trừ ID hiện tại để không báo lỗi trùng lặp với chính số điện thoại cũ của mình
        if (memberRepository.existsByPhoneAndIdNot(normalizedPhone, id)) {
            throw new ConflictException("Số điện thoại đã tồn tại trong hệ thống.");
        }

        member.setFullName(request.fullName().trim());
        member.setPhone(normalizedPhone);
        member.setDateOfBirth(request.dateOfBirth());
        member.setGender(request.gender());
        member.setAddress(request.address());
        member.setZaloPhone(normalizedZaloPhone == null ? normalizedPhone : normalizedZaloPhone);
        member.setSource(request.source());

        // Kiểm tra phân quyền: Chỉ chủ phòng (OWNER) mới có quyền đổi trạng thái hoạt động của hội viên
        if (request.status() != null) {
            boolean owner = isOwner();
            if (!owner && request.status() != member.getStatus()) {
                throw new AccessDeniedException("Only the owner can change a member operational status.");
            }
            if (owner) {
                member.setStatus(request.status());
            }
        }
        member.setNote(request.note());

        // Đồng bộ dữ liệu sang tài khoản User Portal tương ứng (nếu đã được cấp)
        syncPortalAccount(member, normalizedPhone);

        return MemberResponse.from(memberRepository.save(member));
    }

    @Transactional(readOnly = true)
    public List<MemberSummaryResponse> list(String keyword, MemberListFilter filter) {
        return resolveSummaries(keyword, filter);
    }

    /**
     * Phân trang danh sách hội viên bằng bộ nhớ (In-memory Bounded Pagination via PageResponse.fromItems).
     * 
     * [KIẾN TRÚC & BẢO MẬT]:
     * - Tại sao không dùng SQL LIMIT/OFFSET trực tiếp ở Repository?
     *   1. Phân quyền dữ liệu (Data Isolation): PT chỉ được thấy học viên mình phụ trách hoặc chưa gán.
     *   2. Trạng thái thẻ động: Tính toán ngày hết hạn (daysUntilExpiration) dựa trên AppClock.today() và gói tập ưu tiên.
     * - Nếu viết SQL thuần sẽ rất nặng, duplicate logic nghiệp vụ với MembershipLifecyclePolicy.
     * - Do đó: DB load tập dữ liệu thô -> Java xử lý nghiệp vụ/bảo mật -> PageResponse.fromItems cắt trang an toàn.
     */
    @Transactional(readOnly = true)
    public PageResponse<MemberSummaryResponse> listPage(String keyword, MemberListFilter filter, int page, int size) {
        return PageResponse.fromItems(resolveSummaries(keyword, filter), page, size, 10);
    }

    /**
     * Thống kê số lượng hội viên phục vụ hiển thị thẻ tổng quan (KPI Dashboard):
     * - activeMembers: Còn hạn trên 7 ngày (daysUntilExpiration > 7).
     * - expiringSoonMembers: Sắp hết hạn trong vòng 7 ngày tới (0 <= daysUntilExpiration <= 7).
     * - expiredMembers: Đã quá hạn (daysUntilExpiration < 0).
     */
    @Transactional(readOnly = true)
    public MemberListStatisticsResponse listStatistics() {
        List<MemberSummaryResponse> summaries = resolveSummaries(null, MemberListFilter.ALL);
        long activeMembers = summaries.stream()
            .filter(summary -> summary.daysUntilExpiration() != null && summary.daysUntilExpiration() > EXPIRING_SOON_DAYS)
            .count();
        long expiringSoonMembers = summaries.stream()
            .filter(summary -> summary.daysUntilExpiration() != null)
            .filter(summary -> summary.daysUntilExpiration() >= 0 && summary.daysUntilExpiration() <= EXPIRING_SOON_DAYS)
            .count();
        long expiredMembers = summaries.stream()
            .filter(summary -> summary.daysUntilExpiration() != null && summary.daysUntilExpiration() < 0)
            .count();

        return new MemberListStatisticsResponse(
            summaries.size(),
            activeMembers,
            expiringSoonMembers,
            expiredMembers
        );
    }

    /**
     * Pipeline lọc và xử lý nghiệp vụ hội viên đa tầng:
     * 1. Tìm kiếm thô theo Tên / SĐT từ Database (SQL LIKE). Lưu ý: Tìm kiếm không chuẩn hóa SĐT như lúc ghi.
     * 2. Lọc phân quyền PT (Security Filter: canAccessMember) -> Ngăn PT xem học viên ngoài thẩm quyền.
     * 3. Sắp xếp hồ sơ mới tạo lên đầu (Member::getCreatedAt DESC).
     * 4. Tính toán gói tập đại diện hiển thị động (preferredSummary dựa trên AppClock.today()).
     * 5. Lọc theo trạng thái hồ sơ: Nếu filter khác ALL thì chỉ lấy hội viên có MemberStatus.ACTIVE.
     * 6. Lọc theo thời hạn gói tập (matchesFilter: ALL, ACTIVE, EXPIRING_SOON, EXPIRED).
     */
    private List<MemberSummaryResponse> resolveSummaries(String keyword, MemberListFilter filter) {
        List<Member> members = StringUtils.hasText(keyword)
            ? memberRepository.findByFullNameContainingIgnoreCaseOrPhoneContaining(keyword.trim(), keyword.trim())
            : memberRepository.findAll();

        LocalDate today = AppClock.today();
        MemberListFilter resolvedFilter = filter == null ? MemberListFilter.ALL : filter;

        return members.stream()
            .filter(member -> memberAccessService.canAccessMember(member.getId())) // 1. Lọc phân quyền PT (chống IDOR)
            .sorted(Comparator.comparing(Member::getCreatedAt).reversed())         // 2. Mới nhất lên đầu
            .map(member -> preferredSummary(member, today))                       // 3. Tính toán gói tập đại diện & ngày hết hạn
            .filter(summary -> resolvedFilter == MemberListFilter.ALL || summary.status() == MemberStatus.ACTIVE) // 4. Chỉ hội viên ACTIVE mới xét hạn thẻ
            .filter(summary -> matchesFilter(summary, resolvedFilter, today))      // 5. Khớp theo bộ lọc ngày tháng
            .toList();
    }

    @Transactional(readOnly = true)
    public Member findEntity(Long id) {
        return memberRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khách hàng."));
    }

    /**
     * Tạo đối tượng MemberSummaryResponse với Gói tập ưu tiên:
     * - Gọi MembershipLifecyclePolicy.preferredMembership để lấy ra gói phù hợp nhất (đang tập > tương lai > quá khứ).
     * - Tính toán ngày còn lại (daysUntilExpiration) dựa trên AppClock.today().
     */
    private MemberSummaryResponse preferredSummary(Member member, LocalDate today) {
        MemberMembership membership = membershipLifecyclePolicy.preferredMembership(
            memberMembershipRepository.findByMemberIdOrderByStartDateDesc(member.getId()),
            today
        ).orElse(null);
        return MemberSummaryResponse.from(
            member,
            membership,
            membership == null ? null : membershipLifecyclePolicy.effectiveStatus(membership, today)
        );
    }

    /**
     * Kiểm tra bản ghi tóm tắt có thỏa mãn bộ lọc MemberListFilter hay không:
     * 
     * [KIẾN TRÚC COMPUTED STATE - TẠI SAO EXPIRING_SOON KHÔNG LƯU TRONG DATABASE?]:
     * - "Sắp hết hạn" là một trạng thái tính toán động theo thời gian thực (Computed State) dựa trên AppClock.today().
     * - Trong 7 ngày sắp hết hạn, hội viên vẫn mang quyền lợi hợp pháp ACTIVE để vào phòng tập bình thường.
     * - Nếu lưu EXPIRING_SOON vào DB (MembershipStatus), mỗi đêm server phải chạy cron job quét update hàng nghìn dòng,
     *   gây lãng phí tài nguyên CPU/IO và rủi ro race condition.
     * - Vì vậy: MembershipStatus (DB) chỉ lưu trạng thái tĩnh (ACTIVE, EXPIRED, CANCELLED, PENDING_PAYMENT),
     *   còn EXPIRING_SOON chỉ nằm trong enum bộ lọc MemberListFilter và được tính toán On-the-fly tại đây.
     * 
     * - ALL: Chấp nhận mọi hồ sơ (kể cả chưa có gói tập).
     * - ACTIVE: Gói đang hiệu lực hôm nay (startDate <= today <= endDate).
     * - EXPIRING_SOON: Gói đang hiệu lực hôm nay VÀ sẽ hết hạn trong vòng 7 ngày tới (EXPIRING_SOON_DAYS = 7).
     * - EXPIRED: Gói đã hết hạn trước ngày hôm nay (endDate < today).
     */
    private boolean matchesFilter(MemberSummaryResponse summary, MemberListFilter filter, LocalDate today) {
        if (filter == MemberListFilter.ALL) {
            return true;
        }
        // Nếu chọn tab ACTIVE/EXPIRING_SOON/EXPIRED mà chưa có gói tập thì không hiển thị
        if (summary.startDate() == null || summary.endDate() == null) {
            return false;
        }

        return switch (filter) {
            case ACTIVE -> !summary.startDate().isAfter(today) && !summary.endDate().isBefore(today);
            case EXPIRING_SOON -> !summary.startDate().isAfter(today)
                && !summary.endDate().isBefore(today)
                && !summary.endDate().isAfter(today.plusDays(EXPIRING_SOON_DAYS));
            case EXPIRED -> summary.endDate().isBefore(today);
            case ALL -> true;
        };
    }

    private boolean isOwner() {
        return SecurityUtils.currentUser()
            .map(AuthenticatedUser::getAuthorities)
            .stream()
            .flatMap(java.util.Collection::stream)
            .anyMatch(authority -> "ROLE_OWNER".equals(authority.getAuthority()));
    }

    private BigDecimal totalDebt(Long memberId) {
        return debtRecordRepository.findByMemberIdOrderByCreatedAtDesc(memberId).stream()
            .filter(debt -> debt.getStatus() == DebtStatus.OPEN || debt.getStatus() == DebtStatus.PARTIALLY_PAID)
            .map(DebtRecord::getRemainingAmount)
            .filter(amount -> amount.compareTo(BigDecimal.ZERO) > 0)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /**
     * Cấp tài khoản Portal cho hội viên:
     * - Điều kiện tiên quyết (requirePortalEligibility): Hội viên phải ACTIVE và có ít nhất 1 gói tập
     *   đang còn hiệu lực hôm nay (hội viên tự tập Gym Standard hay học viên có PT đều đủ điều kiện).
     * - Khởi tạo email định danh nội bộ: member.<phoneDigits>@gymduongdouble.local.
     * - Mật khẩu ban đầu được kiểm tra độ mạnh qua PasswordPolicy và băm BCrypt an toàn.
     */
    @Transactional
    public MemberDetailResponse createPortalAccount(Long memberId, String initialPassword) {
        memberAccessService.ensureCanAccessMember(memberId);
        Member member = findEntity(memberId);
        if (member.getUser() != null) {
            throw new ConflictException("Hội viên này đã có tài khoản Portal.");
        }
        requirePortalEligibility(member);

        String cleanPhone = requirePortalPhone(member);
        String defaultEmail = portalEmailFor(member, cleanPhone);
        User user = findOrCreatePortalUser(member, cleanPhone, defaultEmail);

        String pass = passwordPolicy.requireValid(initialPassword, defaultEmail, cleanPhone);
        user.setPasswordHash(passwordEncoder.encode(pass));
        user.setStatus(UserStatus.ACTIVE);
        User savedUser = userRepository.save(user);

        member.setUser(savedUser);
        memberRepository.save(member);
        return getDetail(memberId);
    }

    /**
     * Cập nhật trạng thái tài khoản Portal (ACTIVE / LOCKED):
     * - Đây là thao tác MỞ KHÓA CHỦ ĐỘNG của Chủ phòng (Owner).
     * - Khi hội viên được kích hoạt lại từ INACTIVE sang ACTIVE, hệ thống cố tình KHÔNG tự mở khóa Portal.
     *   Chủ phòng phải gọi endpoint này để khôi phục quyền đăng nhập, đảm bảo an toàn truy cập mạng.
     */
    @Transactional
    public MemberDetailResponse updatePortalAccountStatus(Long memberId, UserStatus status) {
        memberAccessService.ensureCanAccessMember(memberId);
        Member member = findEntity(memberId);
        if (member.getUser() == null) {
            throw new BadRequestException("Hội viên chưa có tài khoản Portal.");
        }

        member.getUser().setStatus(status);
        userRepository.save(member.getUser());
        return getDetail(memberId);
    }

    /**
     * Đặt lại mật khẩu Portal và thu hồi Token ngay lập tức (Token Revocation):
     * - user.revokeActiveTokens() kích hoạt authVersion++ trên User.
     * - Tất cả JWT token cũ đang lưu trên trình duyệt của hội viên này sẽ bị vô hiệu hóa lập tức.
     */
    @Transactional
    public MemberDetailResponse resetPortalAccountPassword(Long memberId, String newPassword) {
        memberAccessService.ensureCanAccessMember(memberId);
        Member member = findEntity(memberId);
        if (member.getUser() == null) {
            throw new BadRequestException("Hội viên chưa có tài khoản Portal.");
        }

        String pass = passwordPolicy.requireValid(newPassword, member.getUser().getEmail(), member.getUser().getPhone());
        member.getUser().setPasswordHash(passwordEncoder.encode(pass));
        // Tăng authVersion để vô hiệu hóa tất cả JWT đang hoạt động của tài khoản này
        member.getUser().revokeActiveTokens();
        userRepository.save(member.getUser());
        return getDetail(memberId);
    }

    /**
     * Hủy liên kết hoặc xóa an toàn tài khoản Portal:
     * - Gỡ liên kết hai chiều giữa Member và User (member.setUser(null)).
     * - Nếu User chỉ mang role MEMBER và dùng email ảo nội bộ: Xóa hẳn khỏi DB (canDeletePortalUser).
     * - Nếu User có vai trò khác: Chuyển sang LOCKED để bảo toàn tính toàn vẹn dữ liệu và lịch sử.
     */
    @Transactional
    public MemberDetailResponse deletePortalAccount(Long memberId) {
        memberAccessService.ensureCanAccessMember(memberId);
        Member member = findEntity(memberId);
        if (member.getUser() != null) {
            User user = member.getUser();
            member.setUser(null);
            memberRepository.save(member);
            if (canDeletePortalUser(user)) {
                userRepository.delete(user);
            } else if (isMemberOnlyUser(user)) {
                user.setStatus(UserStatus.LOCKED);
                userRepository.save(user);
            }
        }
        return getDetail(memberId);
    }

    private User findOrCreatePortalUser(Member member, String cleanPhone, String defaultEmail) {
        return userRepository.findByPhone(cleanPhone)
            .map(user -> reusablePortalUserOrThrow(user, member.getId(), defaultEmail))
            .or(() -> userRepository.findByEmail(defaultEmail)
                .map(user -> reusablePortalUserOrThrow(user, member.getId(), defaultEmail)))
            .orElseGet(() -> {
                Role role = roleRepository.findByCode("MEMBER")
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vai trò MEMBER"));
                User newUser = new User();
                newUser.setEmail(defaultEmail);
                newUser.setPhone(cleanPhone);
                newUser.setFullName(member.getFullName());
                newUser.getRoles().add(role);
                return newUser;
            });
    }

    private User reusablePortalUserOrThrow(User user, Long memberId, String expectedEmail) {
        if (!isMemberOnlyUser(user) || !expectedEmail.equalsIgnoreCase(user.getEmail())) {
            throw new ConflictException("Số điện thoại này đang thuộc tài khoản quản trị/PT khác, không thể cấp Portal hội viên.");
        }
        memberRepository.findByUserId(user.getId()).ifPresent(linkedMember -> {
            if (!linkedMember.getId().equals(memberId)) {
                throw new ConflictException("Tài khoản Portal này đã được liên kết với hội viên khác.");
            }
        });
        return user;
    }

    private boolean canDeletePortalUser(User user) {
        return isMemberOnlyUser(user)
            && user.getEmail() != null
            && user.getEmail().endsWith("@gymduongdouble.local")
            && memberRepository.findByUserId(user.getId()).isEmpty();
    }

    private boolean isMemberOnlyUser(User user) {
        return user.getRoles().size() == 1
            && user.getRoles().stream().allMatch(role -> "MEMBER".equals(role.getCode()));
    }

    /**
     * Đồng bộ thông tin sang tài khoản User Portal và áp dụng Quy tắc Khóa An Toàn 1 Chiều:
     * 1. Kiểm tra trùng SĐT: Đảm bảo SĐT mới không bị đụng với User khác trong hệ thống.
     * 2. Đồng bộ fullName và phone sang bảng users.
     * 3. One-Way Safety Lock (Quy tắc khóa 1 chiều):
     *    - Khi Member chuyển sang INACTIVE hoặc ARCHIVED -> Tự động khóa Portal (portalUser.setStatus(LOCKED)).
     *    - Khi Member chuyển lại ACTIVE -> KHÔNG tự động mở khóa Portal. Chủ phòng phải chủ động
     *      mở khóa bằng API riêng (updatePortalAccountStatus) để tránh rủi ro hồi sinh quyền truy cập ngoài ý muốn.
     */
    private void syncPortalAccount(Member member, String phone) {
        User portalUser = member.getUser();
        if (portalUser == null) {
            return;
        }
        // Kiểm tra xem số điện thoại mới có bị trùng với một tài khoản người dùng khác không
        userRepository.findByPhone(phone)
            .filter(user -> !user.getId().equals(portalUser.getId()))
            .ifPresent(user -> {
                throw new ConflictException("Số điện thoại này đã thuộc một tài khoản khác trong hệ thống.");
            });
        portalUser.setFullName(member.getFullName());
        portalUser.setPhone(phone);

        // Khóa 1 chiều: Khi hồ sơ ngừng hoạt động thì lập tức khóa tài khoản Portal
        if (member.getStatus() != MemberStatus.ACTIVE) {
            portalUser.setStatus(UserStatus.LOCKED);
        }
        userRepository.save(portalUser);
    }

    private String requirePortalPhone(Member member) {
        if (!StringUtils.hasText(member.getPhone())) {
            throw new BadRequestException("Hội viên cần có số điện thoại trước khi cấp tài khoản Portal.");
        }
        return member.getPhone().trim();
    }

    /**
     * Kiểm tra điều kiện cấp tài khoản Portal:
     * - Trạng thái hồ sơ phải là ACTIVE.
     * - Phải có ít nhất 1 gói tập (Gym tự tập hoặc gói PT) đang còn hiệu lực hôm nay.
     */
    private void requirePortalEligibility(Member member) {
        if (member.getStatus() != MemberStatus.ACTIVE) {
            throw new BadRequestException("Chỉ có thể cấp tài khoản Portal cho hội viên đang hoạt động.");
        }

        boolean hasEffectiveMembership = memberMembershipRepository.findByMemberIdOrderByStartDateDesc(member.getId()).stream()
            .anyMatch(membership -> membershipLifecyclePolicy.isEffective(membership, AppClock.today()));
        if (!hasEffectiveMembership) {
            throw new BadRequestException("Chỉ có thể cấp tài khoản Portal khi hội viên có gói tập đang hiệu lực.");
        }
    }

    private String portalEmailFor(Member member, String cleanPhone) {
        String phoneDigits = cleanPhone.replaceAll("\\D", "");
        return "member." + (phoneDigits.isEmpty() ? member.getId() : phoneDigits) + "@gymduongdouble.local";
    }

}
