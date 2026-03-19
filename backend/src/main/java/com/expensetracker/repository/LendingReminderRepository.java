package com.expensetracker.repository;

import com.expensetracker.entity.LendingReminder;
import com.expensetracker.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LendingReminderRepository extends JpaRepository<LendingReminder, Long> {
    List<LendingReminder> findByUser(User user);
    List<LendingReminder> findByUserAndStatus(User user, String status);
}
