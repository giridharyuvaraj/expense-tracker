package com.expensetracker.service;

import com.expensetracker.dto.request.BudgetRequest;
import com.expensetracker.entity.Budget;
import com.expensetracker.entity.Expense;
import com.expensetracker.entity.User;
import com.expensetracker.repository.BudgetRepository;
import com.expensetracker.repository.ExpenseRepository;
import com.expensetracker.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Service
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;

    public BudgetService(BudgetRepository budgetRepository,
                         ExpenseRepository expenseRepository,
                         UserRepository userRepository) {
        this.budgetRepository = budgetRepository;
        this.expenseRepository = expenseRepository;
        this.userRepository = userRepository;
    }

    private User getCurrentUser() {
        String email = (String) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public List<Budget> getCurrentMonthBudgets() {
        LocalDateTime now = LocalDateTime.now();
        return budgetRepository.findByUserAndMonthAndYear(
                getCurrentUser(), now.getMonthValue(), now.getYear());
    }

    public void setBudget(BudgetRequest request) {
        User user = getCurrentUser();
        Optional<Budget> existing = budgetRepository
                .findByUserAndCategoryAndMonthAndYear(
                        user, request.getCategory(),
                        request.getMonth(), request.getYear());

        Budget budget = existing.orElse(new Budget());
        budget.setUser(user);
        budget.setCategory(request.getCategory());
        budget.setMonthlyLimit(request.getMonthlyLimit());
        budget.setMonth(request.getMonth());
        budget.setYear(request.getYear());

        budgetRepository.save(budget);
    }

    // ── ADD THIS ──
    public void deleteBudget(Long id) {
        Budget budget = budgetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Budget not found with ID: " + id));

        // Security check
        User currentUser = getCurrentUser();
        if (!budget.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        budgetRepository.delete(budget);
        System.out.println("✅ Budget deleted: ID=" + id);
    }

    public String checkBudget(Long userId, String category, double amount) {
        LocalDateTime now = LocalDateTime.now();
        Optional<Budget> budgetOpt = budgetRepository
                .findByUserAndCategoryAndMonthAndYear(
                        userRepository.getReferenceById(userId),
                        category, now.getMonthValue(), now.getYear());

        if (budgetOpt.isEmpty()) return null;

        Budget budget = budgetOpt.get();
        LocalDateTime start = now.withDayOfMonth(1).with(LocalTime.MIN);
        LocalDateTime end = now.withDayOfMonth(
                now.toLocalDate().lengthOfMonth()).with(LocalTime.MAX);

        List<Expense> expenses = expenseRepository
                .findByUserAndExpenseDateBetween(budget.getUser(), start, end);
        double totalSpent = expenses.stream()
                .filter(e -> e.getCategory().equalsIgnoreCase(category))
                .mapToDouble(e -> e.getAmount().doubleValue())
                .sum();

        double percentage = (totalSpent + amount) /
                budget.getMonthlyLimit().doubleValue() * 100;

        if (percentage >= 100) return "EXCEEDED";
        if (percentage >= 80) return "WARNING";
        return null;
    }
}