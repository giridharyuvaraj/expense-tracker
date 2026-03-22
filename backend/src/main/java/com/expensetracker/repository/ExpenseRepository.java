package com.expensetracker.repository;

import com.expensetracker.entity.Expense;
import com.expensetracker.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    Page<Expense> findByUser(User user, Pageable pageable);
    List<Expense> findByUserAndExpenseDateBetween(User user, LocalDateTime start, LocalDateTime end);
    Page<Expense> findByUserAndCategory(User user, String category, Pageable pageable);
}
