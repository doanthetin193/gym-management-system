package com.gymduongdouble.backend.member.web;

import com.gymduongdouble.backend.common.web.dto.ApiResponse;
import com.gymduongdouble.backend.member.service.MemberService;
import com.gymduongdouble.backend.member.web.dto.MemberCreateRequest;
import com.gymduongdouble.backend.member.web.dto.MemberDetailResponse;
import com.gymduongdouble.backend.member.web.dto.MemberListFilter;
import com.gymduongdouble.backend.member.web.dto.MemberResponse;
import com.gymduongdouble.backend.member.web.dto.MemberSummaryResponse;
import com.gymduongdouble.backend.member.web.dto.MemberUpdateRequest;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/members")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;

    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    public ApiResponse<MemberResponse> create(@Valid @RequestBody MemberCreateRequest request) {
        return ApiResponse.created(memberService.create(request));
    }

    @GetMapping("/{id}")
    public ApiResponse<MemberDetailResponse> get(@PathVariable Long id) {
        return ApiResponse.ok(memberService.getDetail(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ApiResponse<MemberResponse> update(@PathVariable Long id, @Valid @RequestBody MemberUpdateRequest request) {
        return ApiResponse.ok(memberService.update(id, request));
    }

    @GetMapping
    public ApiResponse<List<MemberSummaryResponse>> list(
        @RequestParam(required = false) String keyword,
        @RequestParam(defaultValue = "ALL") MemberListFilter filter
    ) {
        return ApiResponse.ok(memberService.list(keyword, filter));
    }
}
