package com.expensetracker.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "loan_suggestions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoanSuggestion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loan_id", nullable = false)
    private Loan loan;

    @Column(name = "suggestion_type", length = 50)
    private String suggestionType;

    @Column(name = "suggestion_text", columnDefinition = "TEXT")
    private String suggestionText;

    @Column(name = "potential_savings", precision = 15, scale = 2)
    private BigDecimal potentialSavings;

    @Column(name = "is_applied")
    private boolean applied = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
