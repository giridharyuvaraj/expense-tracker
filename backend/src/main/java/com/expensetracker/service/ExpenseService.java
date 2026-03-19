package com.expensetracker.service;

import com.expensetracker.dto.request.ExpenseRequest;
import com.expensetracker.entity.Expense;
import com.expensetracker.entity.User;
import com.expensetracker.repository.ExpenseRepository;
import com.expensetracker.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;
    private final BudgetService budgetService;

    public ExpenseService(ExpenseRepository expenseRepository, UserRepository userRepository, BudgetService budgetService) {
        this.expenseRepository = expenseRepository;
        this.userRepository = userRepository;
        this.budgetService = budgetService;
    }

    private User getCurrentUser() {
        String email = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
    }

    public Page<Expense> getAllExpenses(Pageable pageable) {
        return expenseRepository.findByUser(getCurrentUser(), pageable);
    }

    public String addExpense(ExpenseRequest request) {
        User user = getCurrentUser();
        
        // Check budget before saving
        String budgetStatus = budgetService.checkBudget(user.getId(), request.getCategory(), request.getAmount().doubleValue());

        Expense expense = Expense.builder()
                .user(user)
                .amount(request.getAmount())
                .category(request.getCategory())
                .description(request.getDescription())
                .necessary(request.isNecessary())
                .expenseDate(request.getExpenseDate())
                .build();

        expenseRepository.save(expense);
        return budgetStatus;
    }

    public void updateExpense(Long id, ExpenseRequest request) {
        Expense expense = expenseRepository.findById(id).orElseThrow(() -> new RuntimeException("Expense not found"));
        if (!expense.getUser().getId().equals(getCurrentUser().getId())) {
            throw new RuntimeException("Unauthorized");
        }

        expense.setAmount(request.getAmount());
        expense.setCategory(request.getCategory());
        expense.setDescription(request.getDescription());
        expense.setNecessary(request.isNecessary());
        expense.setExpenseDate(request.getExpenseDate());

        expenseRepository.save(expense);
    }

    public void deleteExpense(Long id) {
        Expense expense = expenseRepository.findById(id).orElseThrow(() -> new RuntimeException("Expense not found"));
        if (!expense.getUser().getId().equals(getCurrentUser().getId())) {
            throw new RuntimeException("Unauthorized");
        }
        expenseRepository.delete(expense);
    }
}
