package com.gymduongdouble.backend.finance.web;

import com.gymduongdouble.backend.common.web.dto.ApiResponse;
import com.gymduongdouble.backend.common.enums.PaymentMethod;
import com.gymduongdouble.backend.finance.service.PaymentService;
import com.gymduongdouble.backend.finance.web.dto.CreatePaymentRequest;
import com.gymduongdouble.backend.finance.web.dto.PaymentResponse;
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
}
