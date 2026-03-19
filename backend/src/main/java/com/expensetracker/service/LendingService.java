package com.expensetracker.service;

import com.expensetracker.entity.LendingReminder;
import com.expensetracker.entity.User;
import com.expensetracker.repository.LendingReminderRepository;
import com.expensetracker.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class LendingService {

    private final LendingReminderRepository lendingRepository;
    private final UserRepository userRepository;

    public LendingService(LendingReminderRepository lendingRepository,
                          UserRepository userRepository) {
        this.lendingRepository = lendingRepository;
        this.userRepository = userRepository;
    }

    private User getCurrentUser() {
        String email = (String) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public List<LendingReminder> getLendingRecords() {
        return lendingRepository.findByUser(getCurrentUser());
    }

    public void addLending(LendingReminder lending) {
        User user = getCurrentUser();
        lending.setUser(user);

        // Ensure defaults
        if (lending.getStatus() == null || lending.getStatus().isEmpty()) {
            lending.setStatus("PENDING");
        }
        if (lending.getAmountReceived() == null) {
            lending.setAmountReceived(BigDecimal.ZERO);
        }

        lendingRepository.save(lending);
        System.out.println("✅ Lending saved for user: " + user.getEmail());
    }

    public void updateStatus(Long id, String status, BigDecimal received) {
        LendingReminder lending = lendingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Record not found with ID: " + id));

        // Security check
        User currentUser = getCurrentUser();
        if (!lending.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        lending.setStatus(status);
        if (received != null) {
            BigDecimal current = lending.getAmountReceived() != null ?
                    lending.getAmountReceived() : BigDecimal.ZERO;
            lending.setAmountReceived(current.add(received));

            // Auto-mark as CLEARED if fully paid
            if (lending.getAmountReceived()
                    .compareTo(lending.getAmount()) >= 0) {
                lending.setStatus("CLEARED");
            }
        }

        lendingRepository.save(lending);
    }

    public void deleteLending(Long id) {
        LendingReminder lending = lendingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Record not found with ID: " + id));

        // Security check
        User currentUser = getCurrentUser();
        if (!lending.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        lendingRepository.delete(lending);
    }
}