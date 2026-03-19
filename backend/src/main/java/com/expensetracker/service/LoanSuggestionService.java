package com.expensetracker.service;

import com.expensetracker.entity.Loan;
import com.expensetracker.entity.LoanSuggestion;
import com.expensetracker.entity.User;
import com.expensetracker.repository.LoanRepository;
import com.expensetracker.repository.LoanSuggestionRepository;
import com.expensetracker.util.FinanceCalculator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class LoanSuggestionService {

    private final LoanRepository loanRepository;
    private final LoanSuggestionRepository loanSuggestionRepository;

    public LoanSuggestionService(LoanRepository loanRepository, LoanSuggestionRepository loanSuggestionRepository) {
        this.loanRepository = loanRepository;
        this.loanSuggestionRepository = loanSuggestionRepository;
    }

    @Transactional
    public List<LoanSuggestion> generateSuggestions(User user) {
        List<Loan> activeLoans = loanRepository.findByUserAndStatus(user, "ACTIVE");
        if (activeLoans.isEmpty()) return new ArrayList<>();

        loanSuggestionRepository.deleteByUser(user);
        List<LoanSuggestion> suggestions = new ArrayList<>();

        // 1. Avalanche Strategy (Highest Interest Rate)
        activeLoans.stream()
                .max(Comparator.comparing(Loan::getInterestRate))
                .ifPresent(loan -> {
                    Map<String, Object> benefit = FinanceCalculator.calculateExtraPaymentBenefit(
                            loan.getOutstandingBalance().doubleValue(),
                            loan.getInterestRate().doubleValue(),
                            FinanceCalculator.calculateRemainingMonths(loan),
                            500.0 // Default extra payment for suggestion
                    );
                    suggestions.add(LoanSuggestion.builder()
                            .user(user)
                            .loan(loan)
                            .suggestionType("AVALANCHE")
                            .suggestionText(String.format("Pay ₹500 extra/month on %s — saves ₹%s interest, closes %d months early",
                                    loan.getTitle(), benefit.get("interestSaved"), benefit.get("monthsSaved")))
                            .potentialSavings((BigDecimal) benefit.get("interestSaved"))
                            .build());
                });

        // 2. Snowball Strategy (Smallest Balance)
        activeLoans.stream()
                .min(Comparator.comparing(Loan::getOutstandingBalance))
                .ifPresent(loan -> {
                    int months = FinanceCalculator.calculateRemainingMonths(loan);
                    suggestions.add(LoanSuggestion.builder()
                            .user(user)
                            .loan(loan)
                            .suggestionType("SNOWBALL")
                            .suggestionText(String.format("Pay ₹500 extra on %s to close it in %d months. Frees up ₹%s/month for other loans.",
                                    loan.getTitle(), (int)Math.ceil(loan.getOutstandingBalance().doubleValue() / (loan.getEmiAmount().doubleValue() + 500)), loan.getEmiAmount()))
                            .build());
                });

        return loanSuggestionRepository.saveAll(suggestions);
    }
}
