package com.gymduongdouble.backend.member.service;

import com.gymduongdouble.backend.common.enums.MemberStatus;
import com.gymduongdouble.backend.common.enums.MembershipStatus;
import com.gymduongdouble.backend.common.enums.DebtStatus;
import com.gymduongdouble.backend.common.enums.UserStatus;
import com.gymduongdouble.backend.common.exception.BadRequestException;
import com.gymduongdouble.backend.common.exception.ConflictException;
import com.gymduongdouble.backend.common.exception.ResourceNotFoundException;
import com.gymduongdouble.backend.finance.domain.DebtRecord;
import com.gymduongdouble.backend.finance.repository.DebtRecordRepository;
import com.gymduongdouble.backend.member.domain.Member;
import com.gymduongdouble.backend.member.repository.MemberRepository;
import com.gymduongdouble.backend.member.web.dto.MemberCreateRequest;
import com.gymduongdouble.backend.member.web.dto.MemberDetailResponse;
import com.gymduongdouble.backend.member.web.dto.MemberListFilter;
import com.gymduongdouble.backend.member.web.dto.MemberResponse;
import com.gymduongdouble.backend.member.web.dto.MemberSummaryResponse;
import com.gymduongdouble.backend.member.web.dto.MemberUpdateRequest;
import com.gymduongdouble.backend.member.web.dto.PtSessionPackageResponse;
import com.gymduongdouble.backend.membership.domain.MemberMembership;
import com.gymduongdouble.backend.membership.repository.MemberMembershipRepository;
import com.gymduongdouble.backend.membership.web.dto.MemberMembershipResponse;
import com.gymduongdouble.backend.pt.repository.PtSessionPackageRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import com.gymduongdouble.backend.user.domain.Role;
import com.gymduongdouble.backend.user.domain.User;
import com.gymduongdouble.backend.user.repository.RoleRepository;
import com.gymduongdouble.backend.user.repository.UserRepository;

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
    private final MemberAccessService memberAccessService;

    @Transactional
    public MemberResponse create(MemberCreateRequest request) {
        memberRepository.findByPhone(request.phone().trim()).ifPresent(member -> {
            throw new ConflictException("Số điện thoại đã tồn tại trong hệ thống.");
        });

        Member member = new Member();
        member.setFullName(request.fullName().trim());
        member.setPhone(request.phone().trim());
        member.setDateOfBirth(request.dateOfBirth());
        member.setGender(request.gender());
        member.setAddress(request.address());
        member.setZaloPhone(StringUtils.hasText(request.zaloPhone()) ? request.zaloPhone().trim() : request.phone().trim());
        member.setSource(request.source());
        member.setStatus(MemberStatus.ACTIVE);
        member.setNote(request.note());

        return MemberResponse.from(memberRepository.save(member));
    }

    @Transactional(readOnly = true)
    public MemberDetailResponse getDetail(Long id) {
        memberAccessService.ensureCanAccessMember(id);
        Member member = findEntity(id);
        LocalDate today = LocalDate.now();
        List<MemberMembership> memberships = memberMembershipRepository.findByMemberIdOrderByStartDateDesc(id);

        List<MemberMembershipResponse> activeMemberships = memberships.stream()
            .filter(membership -> isActiveMembership(membership, today))
            .map(MemberMembershipResponse::from)
            .toList();

        List<MemberMembershipResponse> membershipHistory = memberships.stream()
            .filter(membership -> !isActiveMembership(membership, today))
            .map(MemberMembershipResponse::from)
            .toList();

        List<PtSessionPackageResponse> ptSessionPackages = ptSessionPackageRepository.findByMemberIdOrderByStartDateDesc(id).stream()
            .map(PtSessionPackageResponse::from)
            .toList();

        return new MemberDetailResponse(
            MemberResponse.from(member),
            activeMemberships,
            membershipHistory,
            ptSessionPackages,
            totalDebt(id)
        );
    }

    @Transactional
    public MemberResponse update(Long id, MemberUpdateRequest request) {
        memberAccessService.ensureCanAccessMember(id);
        Member member = findEntity(id);
        String normalizedPhone = request.phone().trim();

        if (memberRepository.existsByPhoneAndIdNot(normalizedPhone, id)) {
            throw new ConflictException("Số điện thoại đã tồn tại trong hệ thống.");
        }

        member.setFullName(request.fullName().trim());
        member.setPhone(normalizedPhone);
        member.setDateOfBirth(request.dateOfBirth());
        member.setGender(request.gender());
        member.setAddress(request.address());
        member.setZaloPhone(StringUtils.hasText(request.zaloPhone()) ? request.zaloPhone().trim() : normalizedPhone);
        member.setSource(request.source());
        member.setStatus(request.status() == null ? member.getStatus() : request.status());
        member.setNote(request.note());

        return MemberResponse.from(memberRepository.save(member));
    }

    @Transactional(readOnly = true)
    public List<MemberSummaryResponse> list(String keyword, MemberListFilter filter) {
        List<Member> members = StringUtils.hasText(keyword)
            ? memberRepository.findByFullNameContainingIgnoreCaseOrPhoneContaining(keyword.trim(), keyword.trim())
            : memberRepository.findAll();

        LocalDate today = LocalDate.now();
        MemberListFilter resolvedFilter = filter == null ? MemberListFilter.ALL : filter;

        return members.stream()
            .filter(member -> memberAccessService.canAccessMember(member.getId()))
            .sorted(Comparator.comparing(Member::getCreatedAt).reversed())
            .map(member -> MemberSummaryResponse.from(member, latestMembership(member.getId())))
            .filter(summary -> matchesFilter(summary, resolvedFilter, today))
            .toList();
    }

    @Transactional(readOnly = true)
    public Member findEntity(Long id) {
        return memberRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khách hàng."));
    }

    private MemberMembership latestMembership(Long memberId) {
        return memberMembershipRepository.findByMemberIdOrderByStartDateDesc(memberId).stream()
            .filter(membership -> membership.getStatus() != MembershipStatus.CANCELLED)
            .max(Comparator.comparing(MemberMembership::getEndDate))
            .orElse(null);
    }

    private boolean isActiveMembership(MemberMembership membership, LocalDate today) {
        return membership.getStatus() != MembershipStatus.CANCELLED && !membership.getEndDate().isBefore(today);
    }

    private boolean matchesFilter(MemberSummaryResponse summary, MemberListFilter filter, LocalDate today) {
        if (filter == MemberListFilter.ALL) {
            return true;
        }
        if (summary.endDate() == null) {
            return false;
        }

        return switch (filter) {
            case ACTIVE -> !summary.endDate().isBefore(today);
            case EXPIRING_SOON -> !summary.endDate().isBefore(today)
                && !summary.endDate().isAfter(today.plusDays(EXPIRING_SOON_DAYS));
            case EXPIRED -> summary.endDate().isBefore(today);
            case ALL -> true;
        };
    }

    private BigDecimal totalDebt(Long memberId) {
        return debtRecordRepository.findByMemberIdOrderByCreatedAtDesc(memberId).stream()
            .filter(debt -> debt.getStatus() == DebtStatus.OPEN || debt.getStatus() == DebtStatus.PARTIALLY_PAID)
            .map(DebtRecord::getRemainingAmount)
            .filter(amount -> amount.compareTo(BigDecimal.ZERO) > 0)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Transactional
    public MemberDetailResponse createPortalAccount(Long memberId, String initialPassword) {
        memberAccessService.ensureCanAccessMember(memberId);
        Member member = findEntity(memberId);
        if (member.getUser() != null) {
            throw new ConflictException("Hội viên này đã có tài khoản Portal.");
        }

        String cleanPhone = requirePortalPhone(member);
        String defaultEmail = portalEmailFor(member, cleanPhone);
        User user = findOrCreatePortalUser(member, cleanPhone, defaultEmail);

        String pass = requirePortalPassword(initialPassword);
        user.setPasswordHash(passwordEncoder.encode(pass));
        user.setStatus(UserStatus.ACTIVE);
        User savedUser = userRepository.save(user);

        member.setUser(savedUser);
        memberRepository.save(member);
        return getDetail(memberId);
    }

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

    @Transactional
    public MemberDetailResponse resetPortalAccountPassword(Long memberId, String newPassword) {
        memberAccessService.ensureCanAccessMember(memberId);
        Member member = findEntity(memberId);
        if (member.getUser() == null) {
            throw new BadRequestException("Hội viên chưa có tài khoản Portal.");
        }

        String pass = requirePortalPassword(newPassword);
        member.getUser().setPasswordHash(passwordEncoder.encode(pass));
        userRepository.save(member.getUser());
        return getDetail(memberId);
    }

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

    private String requirePortalPhone(Member member) {
        if (!StringUtils.hasText(member.getPhone())) {
            throw new BadRequestException("Hội viên cần có số điện thoại trước khi cấp tài khoản Portal.");
        }
        return member.getPhone().trim();
    }

    private String portalEmailFor(Member member, String cleanPhone) {
        String phoneDigits = cleanPhone.replaceAll("\\D", "");
        return "member." + (phoneDigits.isEmpty() ? member.getId() : phoneDigits) + "@gymduongdouble.local";
    }

    private String requirePortalPassword(String password) {
        if (!StringUtils.hasText(password)) {
            throw new BadRequestException("Mật khẩu portal là bắt buộc.");
        }
        String cleanPassword = password.trim();
        if (cleanPassword.length() < 6) {
            throw new BadRequestException("Mật khẩu portal tối thiểu 6 ký tự.");
        }
        return cleanPassword;
    }
}
