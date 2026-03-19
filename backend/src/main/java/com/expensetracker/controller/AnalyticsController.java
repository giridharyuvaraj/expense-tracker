package com.expensetracker.controller;

import com.expensetracker.dto.response.ApiResponse;
import com.expensetracker.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse> getSummary(@RequestParam int month, @RequestParam int year) {
        return ResponseEntity.ok(ApiResponse.success("Summary fetched", analyticsService.getMonthlySummary(month, year)));
    }

    @GetMapping("/comparison")
    public ResponseEntity<ApiResponse> getComparison() {
        return ResponseEntity.ok(ApiResponse.success("Comparison fetched", analyticsService.getSixMonthComparison()));
    }

    @GetMapping("/breakdown")
    public ResponseEntity<ApiResponse> getBreakdown() {
        return ResponseEntity.ok(ApiResponse.success("Breakdown fetched", analyticsService.getSalaryBreakdown()));
    }

    @GetMapping("/insights")
    public ResponseEntity<ApiResponse> getInsights() {
        return ResponseEntity.ok(ApiResponse.success("Insights fetched", analyticsService.getInsights()));
    }
}
