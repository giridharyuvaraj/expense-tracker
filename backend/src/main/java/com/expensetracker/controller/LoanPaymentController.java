package com.expensetracker.controller;

import com.expensetracker.dto.response.ApiResponse;
import com.expensetracker.service.LoanPaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;

@RestController
@RequestMapping("/api/loan-payments")
public class LoanPaymentController {

    private final LoanPaymentService paymentService;

    public LoanPaymentController(LoanPaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse> logPayment(@RequestParam Long loanId, @RequestParam BigDecimal amount, @RequestParam(defaultValue = "0") BigDecimal extraPayment) {
        paymentService.logPayment(loanId, amount, extraPayment);
        return ResponseEntity.ok(ApiResponse.success("Payment logged", null));
    }

    @GetMapping("/{loanId}")
    public ResponseEntity<ApiResponse> getHistory(@PathVariable Long loanId) {
        return ResponseEntity.ok(ApiResponse.success("History fetched", paymentService.getPaymentHistory(loanId)));
    }
}
