package com.gymduongdouble.backend.member.service;

import com.gymduongdouble.backend.common.enums.MemberStatus;
import com.gymduongdouble.backend.common.exception.ConflictException;
import com.gymduongdouble.backend.common.exception.ResourceNotFoundException;
import com.gymduongdouble.backend.member.domain.Member;
import com.gymduongdouble.backend.member.repository.MemberRepository;
import com.gymduongdouble.backend.member.web.dto.MemberCreateRequest;
import com.gymduongdouble.backend.member.web.dto.MemberResponse;
import com.gymduongdouble.backend.member.web.dto.MemberSummaryResponse;
import com.gymduongdouble.backend.membership.domain.MemberMembership;
import com.gymduongdouble.backend.membership.repository.MemberMembershipRepository;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class MemberService {

    private final MemberRepository memberRepository;
    private final MemberMembershipRepository memberMembershipRepository;

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
    public MemberResponse get(Long id) {
        return MemberResponse.from(findEntity(id));
    }

    @Transactional(readOnly = true)
    public List<MemberSummaryResponse> list(String keyword) {
        List<Member> members = StringUtils.hasText(keyword)
            ? memberRepository.findByFullNameContainingIgnoreCaseOrPhoneContaining(keyword.trim(), keyword.trim())
            : memberRepository.findAll();

        return members.stream()
            .sorted(Comparator.comparing(Member::getCreatedAt).reversed())
            .map(member -> MemberSummaryResponse.from(member, latestMembership(member.getId())))
            .toList();
    }

    @Transactional(readOnly = true)
    public Member findEntity(Long id) {
        return memberRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khách hàng."));
    }

    private MemberMembership latestMembership(Long memberId) {
        return memberMembershipRepository.findByMemberIdOrderByStartDateDesc(memberId).stream()
            .findFirst()
            .orElse(null);
    }
}
