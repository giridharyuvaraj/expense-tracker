package com.expensetracker.repository;

import com.expensetracker.entity.Loan;
import com.expensetracker.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LoanRepository extends JpaRepository<Loan, Long> {
    List<Loan> findByUserAndStatus(User user, String status);
    List<Loan> findByUser(User user);
}
