package com.expensetracker.service;

import com.expensetracker.entity.Expense;
import com.expensetracker.entity.Loan;
import com.expensetracker.entity.User;
import com.expensetracker.repository.ExpenseRepository;
import com.expensetracker.repository.LoanRepository;
import com.expensetracker.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final ExpenseRepository expenseRepository;
    private final LoanRepository loanRepository;
    private final UserRepository userRepository;

    public AnalyticsService(ExpenseRepository expenseRepository, LoanRepository loanRepository, UserRepository userRepository) {
        this.expenseRepository = expenseRepository;
        this.loanRepository = loanRepository;
        this.userRepository = userRepository;
    }

    private User getCurrentUser() {
        String email = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
    }

    public Map<String, Double> getMonthlySummary(int month, int year) {
        User user = getCurrentUser();
        LocalDateTime start = LocalDateTime.of(year, month, 1, 0, 0);
        LocalDateTime end = start.withDayOfMonth(start.toLocalDate().lengthOfMonth()).with(LocalTime.MAX);
        
        List<Expense> expenses = expenseRepository.findByUserAndExpenseDateBetween(user, start, end);
        return expenses.stream()
                .collect(Collectors.groupingBy(Expense::getCategory, Collectors.summingDouble(e -> e.getAmount().doubleValue())));
    }

    public List<Map<String, Object>> getSixMonthComparison() {
        User user = getCurrentUser();
        List<Map<String, Object>> result = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (int i = 5; i >= 0; i--) {
            LocalDateTime start = now.minusMonths(i).withDayOfMonth(1).with(LocalTime.MIN);
            LocalDateTime end = start.withDayOfMonth(start.toLocalDate().lengthOfMonth()).with(LocalTime.MAX);
            
            List<Expense> expenses = expenseRepository.findByUserAndExpenseDateBetween(user, start, end);
            double total = expenses.stream().mapToDouble(e -> e.getAmount().doubleValue()).sum();

            Map<String, Object> data = new HashMap<>();
            data.put("month", start.getMonthValue());
            data.put("year", start.getYear());
            data.put("total", total);
            result.add(data);
        }
        return result;
    }

    public Map<String, Object> getSalaryBreakdown() {
        User user = getCurrentUser();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start = now.withDayOfMonth(1).with(LocalTime.MIN);
        LocalDateTime end = now.withDayOfMonth(now.toLocalDate().lengthOfMonth()).with(LocalTime.MAX);

        double totalExpenses = expenseRepository.findByUserAndExpenseDateBetween(user, start, end)
                .stream().mapToDouble(e -> e.getAmount().doubleValue()).sum();

        double totalEMI = loanRepository.findByUserAndStatus(user, "ACTIVE")
                .stream().mapToDouble(l -> l.getEmiAmount().doubleValue()).sum();

        Map<String, Object> breakdown = new HashMap<>();
        breakdown.put("salary", user.getSalary());
        breakdown.put("totalEMI", totalEMI);
        breakdown.put("totalExpenses", totalExpenses);
        breakdown.put("savings", user.getSalary().doubleValue() - totalEMI - totalExpenses);
        return breakdown;
    }

    public List<String> getInsights() {
        User user = getCurrentUser();
        List<String> insights = new ArrayList<>();
        // Add rule-based insights logic here
        insights.add("Entertainment is your highest spending category this month.");
        insights.add("You are on track with your Transport budget.");
        return insights;
    }
}
