package com.expensetracker.controller;

import com.expensetracker.dto.request.LoanRequest;
import com.expensetracker.dto.response.ApiResponse;
import com.expensetracker.entity.Loan;
import com.expensetracker.service.LoanService;
import com.expensetracker.service.LoanSuggestionService;
import com.expensetracker.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/loans")
public class LoanController {

    private final LoanService loanService;
    private final LoanSuggestionService suggestionService;
    private final UserRepository userRepository;

    public LoanController(LoanService loanService,
                          LoanSuggestionService suggestionService,
                          UserRepository userRepository) {
        this.loanService = loanService;
        this.suggestionService = suggestionService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse> getLoans() {
        try {
            List<Loan> loans = loanService.getActiveLoans();
            return ResponseEntity.ok(ApiResponse.success("Loans fetched", loans));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed: " + e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<ApiResponse> addLoan(
            @RequestBody LoanRequest request) {
        try {
            loanService.addLoan(request);
            return ResponseEntity.ok(ApiResponse.success("Loan added", null));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Failed: " + e.getMessage()));
        }
    }

    // ── ADD THIS ──
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteLoan(@PathVariable Long id) {
        try {
            loanService.deleteLoan(id);
            return ResponseEntity.ok(ApiResponse.success("Loan deleted", null));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Failed: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}/amortization")
    public ResponseEntity<ApiResponse> getAmortization(
            @PathVariable Long id) {
        try {
            return ResponseEntity.ok(ApiResponse.success("Schedule fetched",
                    loanService.getAmortizationSchedule(id)));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Failed: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/simulate")
    public ResponseEntity<ApiResponse> simulate(
            @PathVariable Long id,
            @RequestParam double extraPayment) {
        try {
            return ResponseEntity.ok(ApiResponse.success("Simulation complete",
                    loanService.simulateExtraPayment(id, extraPayment)));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Failed: " + e.getMessage()));
        }
    }

    @GetMapping("/suggestions")
    public ResponseEntity<ApiResponse> getSuggestions() {
        try {
            String email = (String) SecurityContextHolder.getContext()
                    .getAuthentication().getPrincipal();
            return ResponseEntity.ok(ApiResponse.success("Suggestions fetched",
                    suggestionService.generateSuggestions(
                            userRepository.findByEmail(email).get())));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed: " + e.getMessage()));
        }
    }
}