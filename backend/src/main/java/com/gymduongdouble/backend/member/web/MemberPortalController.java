package com.gymduongdouble.backend.member.web;

import com.gymduongdouble.backend.common.security.AuthenticatedUser;
import com.gymduongdouble.backend.common.web.dto.ApiResponse;
import com.gymduongdouble.backend.member.service.MemberPortalService;
import com.gymduongdouble.backend.member.web.dto.MemberPortalResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/member-portal")
@RequiredArgsConstructor
public class MemberPortalController {

    private final MemberPortalService memberPortalService;

    @GetMapping("/me")
    @PreAuthorize("hasRole('MEMBER')")
    public ApiResponse<MemberPortalResponse> me(@AuthenticationPrincipal AuthenticatedUser user) {
        return ApiResponse.ok(memberPortalService.getPortal(user.getId()));
    }
}
