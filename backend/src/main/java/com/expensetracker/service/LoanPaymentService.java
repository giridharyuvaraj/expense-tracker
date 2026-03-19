package com.expensetracker.service;

import com.expensetracker.entity.Loan;
import com.expensetracker.entity.LoanPayment;
import com.expensetracker.repository.LoanPaymentRepository;
import com.expensetracker.repository.LoanRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class LoanPaymentService {

    private final LoanPaymentRepository paymentRepository;
    private final LoanRepository loanRepository;

    public LoanPaymentService(LoanPaymentRepository paymentRepository, LoanRepository loanRepository) {
        this.paymentRepository = paymentRepository;
        this.loanRepository = loanRepository;
    }

    @Transactional
    public void logPayment(Long loanId, BigDecimal amount, BigDecimal extraPayment) {
        Loan loan = loanRepository.findById(loanId).orElseThrow(() -> new RuntimeException("Loan not found"));
        
        BigDecimal totalPayment = amount.add(extraPayment);
        BigDecimal newBalance = loan.getOutstandingBalance().subtract(totalPayment);
        
        LoanPayment payment = LoanPayment.builder()
                .loan(loan)
                .paymentAmount(amount)
                .extraPayment(extraPayment)
                .paymentDate(java.time.LocalDate.now())
                .balanceAfter(newBalance)
                .build();

        paymentRepository.save(payment);

        loan.setOutstandingBalance(newBalance);
        if (newBalance.compareTo(BigDecimal.ZERO) <= 0) {
            loan.setStatus("CLOSED");
            loan.setOutstandingBalance(BigDecimal.ZERO);
        }
        loanRepository.save(loan);
    }

    public List<LoanPayment> getPaymentHistory(Long loanId) {
        Loan loan = loanRepository.getReferenceById(loanId);
        return paymentRepository.findByLoanOrderByPaymentDateDesc(loan);
    }
}
