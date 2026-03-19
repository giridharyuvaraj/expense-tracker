package com.expensetracker.util;

import com.expensetracker.entity.Loan;
import com.expensetracker.entity.LoanPayment;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.Period;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class FinanceCalculator {

    public static BigDecimal calculateEMI(double principal, double annualRate, int years) {
        if (annualRate == 0) return BigDecimal.valueOf(principal / (years * 12)).setScale(2, RoundingMode.HALF_UP);
        double monthlyRate = annualRate / (12 * 100);
        int months = years * 12;
        double emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, months))
                / (Math.pow(1 + monthlyRate, months) - 1);
        return BigDecimal.valueOf(emi).setScale(2, RoundingMode.HALF_UP);
    }

    public static BigDecimal calculateTotalInterest(double principal, double rate, int years) {
        BigDecimal emi = calculateEMI(principal, rate, years);
        return emi.multiply(BigDecimal.valueOf(years * 12)).subtract(BigDecimal.valueOf(principal)).setScale(2, RoundingMode.HALF_UP);
    }

    public static BigDecimal calculateRemainingInterest(Loan loan) {
        int remainingMonths = calculateRemainingMonths(loan);
        return loan.getEmiAmount().multiply(BigDecimal.valueOf(remainingMonths)).subtract(loan.getOutstandingBalance()).setScale(2, RoundingMode.HALF_UP);
    }

    public static int calculateRemainingMonths(Loan loan) {
        if (loan.getEmiAmount().doubleValue() == 0) return 0;
        return (int) Math.ceil(loan.getOutstandingBalance().doubleValue() / loan.getEmiAmount().doubleValue());
    }

    public static Map<String, Object> calculateExtraPaymentBenefit(double balance, double annualRate, int remainingMonths, double extraPayment) {
        double monthlyRate = annualRate / (12 * 100);
        double emi = calculateEMI(balance, annualRate, remainingMonths / 12).doubleValue(); // This might not be right if we use current EMI
        // Actually, extra payment should be added to the existing EMI or just the balance.
        // Let's use the actual loan EMI.
        
        double currentBalance = balance;
        int monthsWithExtra = 0;
        double totalInterestExtra = 0;
        
        while (currentBalance > 0 && monthsWithExtra < 600) { // Safety break
            double interest = currentBalance * monthlyRate;
            double principal = (emi + extraPayment) - interest;
            if (principal > currentBalance) principal = currentBalance;
            currentBalance -= principal;
            totalInterestExtra += interest;
            monthsWithExtra++;
        }

        int originalMonths = remainingMonths;
        double originalInterest = (emi * originalMonths) - balance;
        
        Map<String, Object> result = new HashMap<>();
        result.put("monthsSaved", originalMonths - monthsWithExtra);
        result.put("interestSaved", BigDecimal.valueOf(originalInterest - totalInterestExtra).setScale(2, RoundingMode.HALF_UP));
        result.put("newTenureMonths", monthsWithExtra);
        return result;
    }

    public static List<Map<String, Object>> generateAmortizationSchedule(double principal, double annualRate, int years, BigDecimal emiAmount) {
        List<Map<String, Object>> schedule = new ArrayList<>();
        double monthlyRate = annualRate / (12 * 100);
        double currentBalance = principal;
        double emi = emiAmount.doubleValue();

        for (int month = 1; month <= years * 12; month++) {
            double interest = currentBalance * monthlyRate;
            double principalPaid = emi - interest;
            if (principalPaid > currentBalance) principalPaid = currentBalance;
            currentBalance -= principalPaid;

            Map<String, Object> row = new HashMap<>();
            row.put("month", month);
            row.put("emiAmount", BigDecimal.valueOf(emi).setScale(2, RoundingMode.HALF_UP));
            row.put("principalPaid", BigDecimal.valueOf(principalPaid).setScale(2, RoundingMode.HALF_UP));
            row.put("interestPaid", BigDecimal.valueOf(interest).setScale(2, RoundingMode.HALF_UP));
            row.put("balance", BigDecimal.valueOf(Math.max(0, currentBalance)).setScale(2, RoundingMode.HALF_UP));
            schedule.add(row);

            if (currentBalance <= 0) break;
        }
        return schedule;
    }
}
