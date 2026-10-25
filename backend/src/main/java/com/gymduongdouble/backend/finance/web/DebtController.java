package com.gymduongdouble.backend.finance.web;

import com.gymduongdouble.backend.common.enums.DebtStatus;
import com.gymduongdouble.backend.common.web.dto.ApiResponse;
import com.gymduongdouble.backend.common.web.dto.PageResponse;
import com.gymduongdouble.backend.finance.service.PaymentService;
import com.gymduongdouble.backend.finance.web.dto.DebtRecordResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/debts")
@RequiredArgsConstructor
public class DebtController {

    private final PaymentService paymentService;

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'PT')")
    public ApiResponse<List<DebtRecordResponse>> list(
        @RequestParam(required = false) Long memberId,
        @RequestParam(required = false) DebtStatus status
    ) {
        return ApiResponse.ok(paymentService.listDebts(memberId, status));
    }

    /**
     * API phân trang danh sách công nợ:
     * - page: Số thứ tự trang (zero-based: 0 là trang đầu tiên).
     * - size: Số lượng bản ghi mỗi trang (mặc định 10).
     */
    @GetMapping("/page")
    @PreAuthorize("hasAnyRole('OWNER', 'PT')")
    public ApiResponse<PageResponse<DebtRecordResponse>> listPage(
        @RequestParam(required = false) Long memberId,
        @RequestParam(required = false) DebtStatus status,
        @RequestParam(required = false) String keyword,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        return ApiResponse.ok(paymentService.listDebtsPage(memberId, status, keyword, page, size));
    }
}
