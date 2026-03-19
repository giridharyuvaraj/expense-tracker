package com.expensetracker.service;

import com.expensetracker.dto.request.LoanRequest;
import com.expensetracker.entity.Loan;
import com.expensetracker.entity.User;
import com.expensetracker.repository.LoanPaymentRepository;
import com.expensetracker.repository.LoanRepository;
import com.expensetracker.repository.LoanSuggestionRepository;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.util.FinanceCalculator;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
public class LoanService {

    private final LoanRepository loanRepository;
    private final UserRepository userRepository;
    private final LoanPaymentRepository loanPaymentRepository;
    private final LoanSuggestionRepository loanSuggestionRepository;

    public LoanService(LoanRepository loanRepository,
            UserRepository userRepository,
            LoanPaymentRepository loanPaymentRepository,
            LoanSuggestionRepository loanSuggestionRepository) {
        this.loanRepository = loanRepository;
        this.userRepository = userRepository;
        this.loanPaymentRepository = loanPaymentRepository;
        this.loanSuggestionRepository = loanSuggestionRepository;
    }

    private User getCurrentUser() {
        String email = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
    }

    public List<Loan> getActiveLoans() {
        return loanRepository.findByUserAndStatus(getCurrentUser(), "ACTIVE");
    }

    public void addLoan(LoanRequest request) {
        User user = getCurrentUser();
        BigDecimal emi = FinanceCalculator.calculateEMI(request.getTotalAmount().doubleValue(),
                request.getInterestRate().doubleValue(), request.getDurationYears());
        LocalDate endDate = request.getStartDate().plusYears(request.getDurationYears());

        Loan loan = Loan.builder()
                .user(user)
                .title(request.getTitle())
                .category(request.getCategory())
                .totalAmount(request.getTotalAmount())
                .outstandingBalance(request.getTotalAmount())
                .durationYears(request.getDurationYears())
                .interestRate(request.getInterestRate())
                .emiAmount(emi)
                .startDate(request.getStartDate())
                .endDate(endDate)
                .repaymentStrategy("STANDARD")
                .status("ACTIVE")
                .build();

        loanRepository.save(loan);
    }

    public List<Map<String, Object>> getAmortizationSchedule(Long id) {
        Loan loan = loanRepository.findById(id).orElseThrow(() -> new RuntimeException("Loan not found"));
        return FinanceCalculator.generateAmortizationSchedule(
                loan.getTotalAmount().doubleValue(),
                loan.getInterestRate().doubleValue(),
                loan.getDurationYears(),
                loan.getEmiAmount());
    }

    public Map<String, Object> simulateExtraPayment(Long id, double extraPayment) {
        Loan loan = loanRepository.findById(id).orElseThrow(() -> new RuntimeException("Loan not found"));
        int remainingMonths = FinanceCalculator.calculateRemainingMonths(loan);
        return FinanceCalculator.calculateExtraPaymentBenefit(
                loan.getOutstandingBalance().doubleValue(),
                loan.getInterestRate().doubleValue(),
                remainingMonths,
                extraPayment);
    }

    public void deleteLoan(Long id) {
        Loan loan = loanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Loan not found with ID: " + id));

        // Security check
        String email = (String) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!loan.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        // Delete related records first to avoid foreign key constraint errors
        try {
            loanPaymentRepository.deleteByLoan(loan);
        } catch (Exception e) {
            System.out.println("No loan payments to delete");
        }

        try {
            loanSuggestionRepository.deleteByLoan(loan);
        } catch (Exception e) {
            System.out.println("No loan suggestions to delete");
        }

        loanRepository.delete(loan);
        System.out.println("✅ Loan deleted: ID=" + id);
    }
}
