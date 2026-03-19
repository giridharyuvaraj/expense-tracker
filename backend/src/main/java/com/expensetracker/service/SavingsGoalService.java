package com.expensetracker.service;

import com.expensetracker.entity.SavingsGoal;
import com.expensetracker.entity.User;
import com.expensetracker.repository.SavingsGoalRepository;
import com.expensetracker.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class SavingsGoalService {

    private final SavingsGoalRepository goalRepository;
    private final UserRepository userRepository;

    public SavingsGoalService(SavingsGoalRepository goalRepository,
                               UserRepository userRepository) {
        this.goalRepository = goalRepository;
        this.userRepository = userRepository;
    }

    private User getCurrentUser() {
        String email = (String) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public List<SavingsGoal> getGoals() {
        return goalRepository.findByUser(getCurrentUser());
    }

    public void addGoal(SavingsGoal goal) {
        User user = getCurrentUser();
        goal.setUser(user);

        // Defaults
        if (goal.getSavedAmount() == null) {
            goal.setSavedAmount(BigDecimal.ZERO);
        }

        // Auto-set month and year from targetDate
        if (goal.getTargetDate() != null) {
            goal.setMonth(goal.getTargetDate().getMonthValue());
            goal.setYear(goal.getTargetDate().getYear());
        } else {
            LocalDate now = LocalDate.now();
            goal.setMonth(now.getMonthValue());
            goal.setYear(now.getYear());
        }

        goalRepository.save(goal);
        System.out.println("✅ Goal saved: " + goal.getGoalName()
                + " for user: " + user.getEmail());
    }

    public void updateSavedAmount(Long id, BigDecimal amount) {
        SavingsGoal goal = goalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Goal not found with ID: " + id));

        // Security check
        User currentUser = getCurrentUser();
        if (!goal.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        BigDecimal current = goal.getSavedAmount() != null ?
                goal.getSavedAmount() : BigDecimal.ZERO;
        goal.setSavedAmount(current.add(amount));
        goalRepository.save(goal);
    }

    public void deleteGoal(Long id) {
        SavingsGoal goal = goalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Goal not found with ID: " + id));

        User currentUser = getCurrentUser();
        if (!goal.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        goalRepository.delete(goal);
    }
}