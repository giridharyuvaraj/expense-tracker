package com.expensetracker.controller;

import com.expensetracker.dto.request.ExpenseRequest;
import com.expensetracker.dto.response.ApiResponse;
import com.expensetracker.entity.Expense;
import com.expensetracker.service.ExpenseService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {

    private final ExpenseService expenseService;

    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse> getExpenses(Pageable pageable) {
        Page<Expense> expenses = expenseService.getAllExpenses(pageable);
        return ResponseEntity.ok(ApiResponse.success("Expenses fetched", expenses));
    }

    @PostMapping
    public ResponseEntity<ApiResponse> addExpense(@Valid @RequestBody ExpenseRequest request) {
        String warning = expenseService.addExpense(request);
        String msg = warning != null ? "Expense added with " + warning : "Expense added successfully";
        return ResponseEntity.ok(ApiResponse.success(msg, null));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse> updateExpense(@PathVariable Long id, @Valid @RequestBody ExpenseRequest request) {
        expenseService.updateExpense(id, request);
        return ResponseEntity.ok(ApiResponse.success("Expense updated", null));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteExpense(@PathVariable Long id) {
        expenseService.deleteExpense(id);
        return ResponseEntity.ok(ApiResponse.success("Expense deleted", null));
    }
}
