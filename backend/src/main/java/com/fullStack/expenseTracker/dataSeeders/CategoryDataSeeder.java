package main.java.com.fullStack.expenseTracker.dataSeeders;

import com.fullStack.expenseTracker.enums.ETransactionType;
import com.fullStack.expenseTracker.models.Category;
import com.fullStack.expenseTracker.models.TransactionType;
import com.fullStack.expenseTracker.repository.CategoryRepository;
import com.fullStack.expenseTracker.repository.TransactionTypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Component
public class CategoryDataSeeder {
    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private TransactionTypeRepository transactionTypeRepository;

    @EventListener
    @Transactional
    public void seedCategories(ContextRefreshedEvent event) {
        TransactionType expense = transactionTypeRepository.findByTransactionTypeName(ETransactionType.TYPE_EXPENSE);
        TransactionType income = transactionTypeRepository.findByTransactionTypeName(ETransactionType.TYPE_INCOME);

        if (expense != null) {
            seedExpenseCategories(expense);
        }
        if (income != null) {
            seedIncomeCategories(income);
        }
    }

    private void seedExpenseCategories(TransactionType type) {
        String[] names = {"Food", "Transportation", "Rent", "Utilities", "Entertainment", "Health", "Shopping"};
        for (String name : names) {
            if (!categoryRepository.existsByCategoryNameAndTransactionType(name, type)) {
                categoryRepository.save(new Category(name, type, true));
            }
        }
    }

    private void seedIncomeCategories(TransactionType type) {
        String[] names = {"Salary", "Freelance", "Gift", "Investment"};
        for (String name : names) {
            if (!categoryRepository.existsByCategoryNameAndTransactionType(name, type)) {
                categoryRepository.save(new Category(name, type, true));
            }
        }
    }
}