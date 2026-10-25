package com.gymduongdouble.backend.finance.web;

import com.gymduongdouble.backend.common.web.dto.ApiResponse;
import com.gymduongdouble.backend.common.web.dto.PageResponse;
import com.gymduongdouble.backend.common.enums.PaymentMethod;
import com.gymduongdouble.backend.finance.service.PaymentService;
import com.gymduongdouble.backend.finance.web.dto.CreatePaymentRequest;
import com.gymduongdouble.backend.finance.web.dto.PaymentResponse;
import com.gymduongdouble.backend.finance.web.dto.FinanceSummaryResponse;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'PT')")
    public ApiResponse<PaymentResponse> create(@Valid @RequestBody CreatePaymentRequest request) {
        return ApiResponse.created(paymentService.create(request));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'PT')")
    public ApiResponse<List<PaymentResponse>> list(
        @RequestParam(required = false) Long memberId,
        @RequestParam(required = false) LocalDate fromDate,
        @RequestParam(required = false) LocalDate toDate,
        @RequestParam(required = false) PaymentMethod paymentMethod
    ) {
        return ApiResponse.ok(paymentService.listPayments(memberId, fromDate, toDate, paymentMethod));
    }

    /**
     * API phân trang danh sách phiếu thu:
     * - page: Số thứ tự trang (zero-based: 0 là trang đầu tiên).
     * - size: Số lượng bản ghi mỗi trang (mặc định 10).
     */
    @GetMapping("/page")
    @PreAuthorize("hasAnyRole('OWNER', 'PT')")
    public ApiResponse<PageResponse<PaymentResponse>> listPage(
        @RequestParam(required = false) Long memberId,
        @RequestParam(required = false) LocalDate fromDate,
        @RequestParam(required = false) LocalDate toDate,
        @RequestParam(required = false) PaymentMethod paymentMethod,
        @RequestParam(required = false) String keyword,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        return ApiResponse.ok(paymentService.listPaymentsPage(memberId, fromDate, toDate, paymentMethod, keyword, page, size));
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('OWNER', 'PT')")
    public ApiResponse<FinanceSummaryResponse> summary() {
        return ApiResponse.ok(paymentService.summary());
    }
}
