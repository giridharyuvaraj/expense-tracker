package com.expensetracker.service;

import com.expensetracker.entity.Expense;
import com.expensetracker.entity.LoanPayment;
import com.expensetracker.entity.User;
import com.expensetracker.repository.ExpenseRepository;
import com.expensetracker.repository.LoanPaymentRepository;
import com.expensetracker.repository.LoanRepository;
import com.expensetracker.repository.UserRepository;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.PrintWriter;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;

@Service
public class ExportService {

    private final ExpenseRepository expenseRepository;
    private final LoanRepository loanRepository;
    private final LoanPaymentRepository loanPaymentRepository;
    private final UserRepository userRepository;

    public ExportService(ExpenseRepository expenseRepository, LoanRepository loanRepository,
                         LoanPaymentRepository loanPaymentRepository, UserRepository userRepository) {
        this.expenseRepository = expenseRepository;
        this.loanRepository = loanRepository;
        this.loanPaymentRepository = loanPaymentRepository;
        this.userRepository = userRepository;
    }

    public byte[] exportExpenses(int month, int year) throws Exception {
        String email = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findByEmail(email).get();

        LocalDateTime start = LocalDateTime.of(year, month, 1, 0, 0);
        LocalDateTime end = start.withDayOfMonth(start.toLocalDate().lengthOfMonth()).with(LocalTime.MAX);
        List<Expense> expenses = expenseRepository.findByUserAndExpenseDateBetween(user, start, end);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        CSVPrinter csvPrinter = new CSVPrinter(new PrintWriter(out), CSVFormat.DEFAULT.withHeader("Date", "Category", "Description", "Amount", "Necessary"));

        for (Expense e : expenses) {
            csvPrinter.printRecord(e.getExpenseDate(), e.getCategory(), e.getDescription(), e.getAmount(), e.isNecessary());
        }
        csvPrinter.flush();
        return out.toByteArray();
    }
}
