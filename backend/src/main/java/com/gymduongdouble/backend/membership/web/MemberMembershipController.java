package com.gymduongdouble.backend.membership.web;

import com.gymduongdouble.backend.common.web.dto.ApiResponse;
import com.gymduongdouble.backend.membership.service.MemberMembershipService;
import com.gymduongdouble.backend.membership.web.dto.CreateMemberMembershipRequest;
import com.gymduongdouble.backend.membership.web.dto.MemberMembershipResponse;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/members/{memberId}/memberships")
@RequiredArgsConstructor
public class MemberMembershipController {

    private final MemberMembershipService memberMembershipService;

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'PT')")
    public ApiResponse<MemberMembershipResponse> create(
        @PathVariable Long memberId,
        @Valid @RequestBody CreateMemberMembershipRequest request
    ) {
        return ApiResponse.created(memberMembershipService.create(memberId, request));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'PT')")
    public ApiResponse<List<MemberMembershipResponse>> listByMember(@PathVariable Long memberId) {
        return ApiResponse.ok(memberMembershipService.listByMember(memberId));
    }
}
