package com.expensetracker.controller;

import com.expensetracker.dto.response.ApiResponse;
import com.expensetracker.entity.SavingsGoal;
import com.expensetracker.service.SavingsGoalService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/savings-goals")
public class SavingsGoalController {

    private final SavingsGoalService goalService;

    public SavingsGoalController(SavingsGoalService goalService) {
        this.goalService = goalService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse> getGoals() {
        try {
            return ResponseEntity.ok(
                    ApiResponse.success("Goals fetched", goalService.getGoals()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed: " + e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<ApiResponse> addGoal(
            @RequestBody SavingsGoal goal) {
        try {
            goalService.addGoal(goal);
            return ResponseEntity.ok(ApiResponse.success("Goal added", null));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Failed: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse> updateSaved(
            @PathVariable Long id,
            @RequestParam BigDecimal amount) {
        try {
            goalService.updateSavedAmount(id, amount);
            return ResponseEntity.ok(
                    ApiResponse.success("Saved amount updated", null));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Failed: " + e.getMessage()));
        }
    }

    // ── ADD THIS ──
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteGoal(@PathVariable Long id) {
        try {
            goalService.deleteGoal(id);
            return ResponseEntity.ok(
                    ApiResponse.success("Goal deleted", null));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Failed: " + e.getMessage()));
        }
    }
}