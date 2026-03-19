package com.expensetracker.controller;

import com.expensetracker.dto.request.BudgetRequest;
import com.expensetracker.dto.response.ApiResponse;
import com.expensetracker.service.BudgetService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/budgets")
public class BudgetController {

    private final BudgetService budgetService;

    public BudgetController(BudgetService budgetService) {
        this.budgetService = budgetService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse> getBudgets() {
        try {
            return ResponseEntity.ok(ApiResponse.success("Budgets fetched",
                    budgetService.getCurrentMonthBudgets()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed: " + e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<ApiResponse> setBudget(
            @Valid @RequestBody BudgetRequest request) {
        try {
            budgetService.setBudget(request);
            return ResponseEntity.ok(
                    ApiResponse.success("Budget set successfully", null));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Failed: " + e.getMessage()));
        }
    }

    // ── ADD THIS ──
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteBudget(@PathVariable Long id) {
        try {
            budgetService.deleteBudget(id);
            return ResponseEntity.ok(
                    ApiResponse.success("Budget deleted", null));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Failed: " + e.getMessage()));
        }
    }
}