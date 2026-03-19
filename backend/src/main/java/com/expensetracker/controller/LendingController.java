package com.expensetracker.controller;

import com.expensetracker.dto.response.ApiResponse;
import com.expensetracker.entity.LendingReminder;
import com.expensetracker.service.LendingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/lending")
public class LendingController {

    private final LendingService lendingService;

    public LendingController(LendingService lendingService) {
        this.lendingService = lendingService;
    }

    // GET all lending records
    @GetMapping
    public ResponseEntity<ApiResponse> getLending() {
        try {
            List<LendingReminder> records = lendingService.getLendingRecords();
            return ResponseEntity.ok(
                ApiResponse.success("Lending records fetched", records));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Failed to fetch: " + e.getMessage()));
        }
    }

    // POST add new lending record
    @PostMapping
    public ResponseEntity<ApiResponse> addLending(
            @RequestBody LendingReminder lending) {
        try {
            System.out.println("📥 Add lending: " + lending.getPersonName()
                + ", amount=" + lending.getAmount()
                + ", lendingDate=" + lending.getLendingDate()
                + ", dueDate=" + lending.getDueDate());

            // Set defaults if null
            if (lending.getStatus() == null) {
                lending.setStatus("PENDING");
            }
            if (lending.getAmountReceived() == null) {
                lending.setAmountReceived(BigDecimal.ZERO);
            }

            lendingService.addLending(lending);
            return ResponseEntity.ok(
                ApiResponse.success("Lending record added", null));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("Failed to add: " + e.getMessage()));
        }
    }

    // PUT update status / partial payment
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse> updateStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @RequestParam(required = false) BigDecimal received) {
        try {
            lendingService.updateStatus(id, status, received);
            return ResponseEntity.ok(
                ApiResponse.success("Status updated", null));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("Failed to update: " + e.getMessage()));
        }
    }

    // DELETE lending record
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteLending(@PathVariable Long id) {
        try {
            lendingService.deleteLending(id);
            return ResponseEntity.ok(
                ApiResponse.success("Record deleted", null));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("Failed to delete: " + e.getMessage()));
        }
    }
}