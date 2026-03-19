package com.expensetracker.repository;

import com.expensetracker.entity.Loan;
import com.expensetracker.entity.LoanSuggestion;
import com.expensetracker.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LoanSuggestionRepository extends JpaRepository<LoanSuggestion, Long> {
    List<LoanSuggestion> findByUser(User user);
    void deleteByUser(User user);
    void deleteByLoan(Loan loan);
}
