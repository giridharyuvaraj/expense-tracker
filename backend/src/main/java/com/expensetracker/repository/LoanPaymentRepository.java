package com.expensetracker.repository;

import com.expensetracker.entity.Loan;
import com.expensetracker.entity.LoanPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LoanPaymentRepository extends JpaRepository<LoanPayment, Long> {
    List<LoanPayment> findByLoanOrderByPaymentDateDesc(Loan loan);
    void deleteByLoan(Loan loan);
}
