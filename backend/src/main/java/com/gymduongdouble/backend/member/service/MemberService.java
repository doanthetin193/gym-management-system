package com.gymduongdouble.backend.member.service;

import com.gymduongdouble.backend.common.enums.MemberStatus;
import com.gymduongdouble.backend.common.enums.MembershipStatus;
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
            .map(DebtRecord::getRemainingAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
