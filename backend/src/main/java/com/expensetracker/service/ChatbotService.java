package com.expensetracker.service;

import com.expensetracker.entity.*;
import com.expensetracker.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Service
public class ChatbotService {

    private final ChatbotSessionRepository sessionRepository;
    private final ChatbotMessageRepository messageRepository;
    private final UserRepository userRepository;
    private final ExpenseRepository expenseRepository;
    private final LoanRepository loanRepository;
    private final BudgetRepository budgetRepository;
    private final SavingsGoalRepository savingsGoalRepository;
    private final LendingReminderRepository lendingReminderRepository;
    private final RestTemplate restTemplate;

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    public ChatbotService(
            ChatbotSessionRepository sessionRepository,
            ChatbotMessageRepository messageRepository,
            UserRepository userRepository,
            ExpenseRepository expenseRepository,
            LoanRepository loanRepository,
            BudgetRepository budgetRepository,
            SavingsGoalRepository savingsGoalRepository,
            LendingReminderRepository lendingReminderRepository,
            RestTemplate restTemplate) {
        this.sessionRepository = sessionRepository;
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.expenseRepository = expenseRepository;
        this.loanRepository = loanRepository;
        this.budgetRepository = budgetRepository;
        this.savingsGoalRepository = savingsGoalRepository;
        this.lendingReminderRepository = lendingReminderRepository;
        this.restTemplate = restTemplate;
    }

    // ─── Get current logged-in user ───────────────────────────────────────────
    private User getCurrentUser() {
        String email = (String) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // ─── Create a new chat session ────────────────────────────────────────────
    public ChatbotSession createSession() {
        User user = getCurrentUser();
        ChatbotSession session = ChatbotSession.builder()
                .user(user)
                .sessionTitle("Chat - " + LocalDateTime.now()
                        .toString().replace("T", " ").substring(0, 16))
                .build();
        ChatbotSession saved = sessionRepository.save(session);
        System.out.println("✅ Session created: ID=" + saved.getId()
                + " for user=" + user.getEmail());
        return saved;
    }

    // ─── Get all sessions for current user ───────────────────────────────────
    public List<ChatbotSession> getSessions() {
        User user = getCurrentUser();
        return sessionRepository.findByUserOrderByCreatedAtDesc(user);
    }

    // ─── Get all messages for a session ──────────────────────────────────────
    public List<ChatbotMessage> getSessionMessages(Long sessionId) {
        ChatbotSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException(
                        "Session not found with ID: " + sessionId));

        User currentUser = getCurrentUser();
        if (!session.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Unauthorized access to session");
        }

        List<ChatbotMessage> messages =
                messageRepository.findBySessionOrderByCreatedAtAsc(session);
        System.out.println("📨 Loaded " + messages.size()
                + " messages for session ID=" + sessionId);
        return messages;
    }

    // ─── Send message and get AI reply ───────────────────────────────────────
    public String chat(Long sessionId, String userMessage) {
        ChatbotSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException(
                        "Session not found with ID: " + sessionId));

        User user = session.getUser();

        User currentUser = getCurrentUser();
        if (!session.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Unauthorized access to session");
        }

        System.out.println("💬 Chat request - sessionId=" + sessionId
                + ", message=" + userMessage);

        // Build system prompt with ALL financial data
        String systemPrompt = buildSystemPrompt(user);

        // Load chat history
        List<ChatbotMessage> history =
                messageRepository.findBySessionOrderByCreatedAtAsc(session);

        // Build Gemini request
        String url = apiUrl + "?key=" + apiKey;
        Map<String, Object> requestBody = new HashMap<>();

        Map<String, Object> systemInstruction = new HashMap<>();
        systemInstruction.put("parts",
                Collections.singletonList(
                        Collections.singletonMap("text", systemPrompt)));
        requestBody.put("system_instruction", systemInstruction);

        List<Map<String, Object>> contents = new ArrayList<>();
        for (ChatbotMessage msg : history) {
            Map<String, Object> content = new HashMap<>();
            content.put("role", msg.getRole().equals("user") ? "user" : "model");
            content.put("parts",
                    Collections.singletonList(
                            Collections.singletonMap("text", msg.getMessage())));
            contents.add(content);
        }

        Map<String, Object> userContent = new HashMap<>();
        userContent.put("role", "user");
        userContent.put("parts",
                Collections.singletonList(
                        Collections.singletonMap("text", userMessage)));
        contents.add(userContent);

        requestBody.put("contents", contents);

        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("temperature", 0.7);
        generationConfig.put("maxOutputTokens", 1000);
        requestBody.put("generationConfig", generationConfig);

        // Call Gemini
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity =
                new HttpEntity<>(requestBody, headers);

        String aiReply =
                "I am sorry, I couldn't process that request. Please try again.";

        try {
            Map<String, Object> response =
                    restTemplate.postForObject(url, entity, Map.class);

            if (response == null) {
                System.err.println("❌ Gemini API returned null response");
            } else {
                List<Map<String, Object>> candidates =
                        (List<Map<String, Object>>) response.get("candidates");

                if (candidates != null && !candidates.isEmpty()) {
                    Map<String, Object> firstCandidate = candidates.get(0);
                    Map<String, Object> content =
                            (Map<String, Object>) firstCandidate.get("content");

                    if (content != null) {
                        List<Map<String, Object>> parts =
                                (List<Map<String, Object>>) content.get("parts");
                        if (parts != null && !parts.isEmpty()) {
                            aiReply = (String) parts.get(0).get("text");
                            System.out.println("✅ Gemini replied successfully");
                        }
                    }
                } else {
                    if (response.containsKey("error")) {
                        Map<String, Object> error =
                                (Map<String, Object>) response.get("error");
                        System.err.println("❌ Gemini API error: " + error);
                        aiReply = "AI service error: " + error.get("message");
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("❌ Gemini API call failed: " + e.getMessage());
            if (e.getMessage() != null && e.getMessage().contains("429")) {
                aiReply = "⚠️ AI quota exceeded. Please wait a minute and try again.";
            } else if (e.getMessage() != null && e.getMessage().contains("404")) {
                aiReply = "⚠️ AI model not available. Please contact support.";
            } else {
                aiReply = "⚠️ AI service is temporarily unavailable. Please try again.";
            }
        }

        // Save both messages to DB
        messageRepository.save(ChatbotMessage.builder()
                .session(session)
                .role("user")
                .message(userMessage)
                .build());

        messageRepository.save(ChatbotMessage.builder()
                .session(session)
                .role("model")
                .message(aiReply)
                .build());

        System.out.println("💾 Messages saved to DB for session ID=" + sessionId);
        return aiReply;
    }

    // ─── Build FULL financial context for AI ─────────────────────────────────
    private String buildSystemPrompt(User user) {

        // ── Loans ──
        List<Loan> loans = loanRepository.findByUserAndStatus(user, "ACTIVE");
        double totalEMI = loans.stream()
                .mapToDouble(l -> l.getEmiAmount() != null ?
                        l.getEmiAmount().doubleValue() : 0.0)
                .sum();

        // ── Expenses (last 3 months) ──
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start = now.minusMonths(3)
                .withDayOfMonth(1).with(LocalTime.MIN);
        List<Expense> recentExpenses =
                expenseRepository.findByUserAndExpenseDateBetween(user, start, now);

        double totalExpenses = recentExpenses.stream()
                .mapToDouble(e -> e.getAmount().doubleValue()).sum();
        double avgMonthlyExpenses = totalExpenses / 3.0;

        // Category breakdown
        Map<String, Double> categoryTotals = new HashMap<>();
        for (Expense e : recentExpenses) {
            categoryTotals.merge(e.getCategory(),
                    e.getAmount().doubleValue(), Double::sum);
        }

        // Unnecessary expenses
        double unnecessaryTotal = recentExpenses.stream()
                .filter(e -> !e.isNecessary())
                .mapToDouble(e -> e.getAmount().doubleValue())
                .sum();

        double salary = user.getSalary() != null ?
                user.getSalary().doubleValue() : 0.0;
        double netSavings = salary - totalEMI - avgMonthlyExpenses;

        // ── Budgets ──
        List<Budget> budgets = budgetRepository.findByUser(user);

        // ── Savings Goals ──
        List<SavingsGoal> savingsGoals = savingsGoalRepository.findByUser(user);

        // ── Lending (pending) ──
        List<LendingReminder> pendingLending =
                lendingReminderRepository.findByUserAndStatus(user, "PENDING");
        List<LendingReminder> partialLending =
                lendingReminderRepository.findByUserAndStatus(user, "PARTIAL");
        double totalPendingCollection = pendingLending.stream()
                .mapToDouble(l -> l.getAmount().doubleValue() -
                        l.getAmountReceived().doubleValue())
                .sum();
        double totalPartialCollection = partialLending.stream()
                .mapToDouble(l -> l.getAmount().doubleValue() -
                        l.getAmountReceived().doubleValue())
                .sum();

        // ── Build Prompt ──
        StringBuilder sb = new StringBuilder();
        sb.append("You are a personal financial advisor for an Indian user. ");
        sb.append("You have FULL access to their financial data. ");
        sb.append("Always give specific, actionable advice with exact rupee amounts.\n\n");

        // Financial Profile
        sb.append("═══ FINANCIAL PROFILE ═══\n");
        sb.append("Monthly Salary: ₹").append(String.format("%.0f", salary)).append("\n");
        sb.append("Total Monthly EMI: ₹").append(String.format("%.0f", totalEMI)).append("\n");
        sb.append("Avg Monthly Expenses: ₹")
                .append(String.format("%.0f", avgMonthlyExpenses)).append("\n");
        sb.append("Net Monthly Savings: ₹")
                .append(String.format("%.0f", netSavings)).append("\n");
        sb.append("Unnecessary Expenses/month: ₹")
                .append(String.format("%.0f", unnecessaryTotal / 3.0)).append("\n");
        sb.append("Savings Rate: ")
                .append(salary > 0 ?
                        String.format("%.1f", (netSavings / salary) * 100) : "0")
                .append("%\n");

        // Active Loans
        sb.append("\n═══ ACTIVE LOANS ═══\n");
        if (loans.isEmpty()) {
            sb.append("No active loans.\n");
        } else {
            for (Loan l : loans) {
                double balance = l.getOutstandingBalance() != null ?
                        l.getOutstandingBalance().doubleValue() : 0.0;
                double rate = l.getInterestRate() != null ?
                        l.getInterestRate().doubleValue() : 0.0;
                double emi = l.getEmiAmount() != null ?
                        l.getEmiAmount().doubleValue() : 0.0;
                double totalInterest = (emi * (l.getDurationYears() != null ?
                        l.getDurationYears() * 12 : 0)) -
                        (l.getTotalAmount() != null ?
                                l.getTotalAmount().doubleValue() : 0.0);
                sb.append("- ").append(l.getTitle())
                        .append(" (").append(l.getCategory()).append(")")
                        .append(": Balance ₹").append(String.format("%.0f", balance))
                        .append(", Rate ").append(rate).append("% p.a.")
                        .append(", EMI ₹").append(String.format("%.0f", emi))
                        .append(", Total Interest ₹")
                        .append(String.format("%.0f", Math.max(0, totalInterest)))
                        .append("\n");
            }
        }

        // Category Spending
        sb.append("\n═══ SPENDING BY CATEGORY (last 3 months avg/month) ═══\n");
        if (categoryTotals.isEmpty()) {
            sb.append("No expense data available.\n");
        } else {
            categoryTotals.entrySet().stream()
                    .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                    .forEach(entry ->
                            sb.append("- ").append(entry.getKey())
                                    .append(": ₹")
                                    .append(String.format("%.0f", entry.getValue() / 3.0))
                                    .append("/month\n"));
        }

        // Budgets vs Actual
        sb.append("\n═══ BUDGET vs ACTUAL SPENDING ═══\n");
        if (budgets.isEmpty()) {
            sb.append("No budgets set yet.\n");
        } else {
            for (Budget b : budgets) {
                double limit = b.getMonthlyLimit() != null ?
                        b.getMonthlyLimit().doubleValue() : 0.0;
                double spent = categoryTotals.getOrDefault(
                        b.getCategory(), 0.0) / 3.0;
                double pct = limit > 0 ? (spent / limit) * 100 : 0;
                String status = pct >= 100 ? "🔴 OVER BUDGET" :
                        pct >= 80 ? "🟡 NEAR LIMIT" : "🟢 ON TRACK";
                sb.append("- ").append(b.getCategory())
                        .append(": Budget ₹").append(String.format("%.0f", limit))
                        .append(", Spent ₹").append(String.format("%.0f", spent))
                        .append(" (").append(String.format("%.0f", pct)).append("%)")
                        .append(" ").append(status).append("\n");
            }
        }

        // Savings Goals
        sb.append("\n═══ SAVINGS GOALS ═══\n");
        if (savingsGoals.isEmpty()) {
            sb.append("No savings goals set.\n");
        } else {
            for (SavingsGoal g : savingsGoals) {
                double target = g.getGoalAmount() != null ?
                        g.getGoalAmount().doubleValue() : 0.0;
                double saved = g.getSavedAmount() != null ?
                        g.getSavedAmount().doubleValue() : 0.0;
                double remaining = Math.max(0, target - saved);
                double pct = target > 0 ? (saved / target) * 100 : 0;
                sb.append("- ").append(g.getGoalName())
                        .append(": Target ₹").append(String.format("%.0f", target))
                        .append(", Saved ₹").append(String.format("%.0f", saved))
                        .append(", Remaining ₹").append(String.format("%.0f", remaining))
                        .append(" (").append(String.format("%.0f", pct)).append("% done)");
                if (g.getTargetDate() != null) {
                    sb.append(", Due: ").append(g.getTargetDate());
                    // Calculate monthly needed
                    long daysLeft = java.time.temporal.ChronoUnit.DAYS.between(
                            java.time.LocalDate.now(), g.getTargetDate());
                    if (daysLeft > 0) {
                        double monthsLeft = daysLeft / 30.0;
                        double monthlyNeeded = remaining / monthsLeft;
                        sb.append(", Need ₹")
                                .append(String.format("%.0f", monthlyNeeded))
                                .append("/month to reach goal");
                    }
                }
                sb.append("\n");
            }
        }

        // Pending Collections
        sb.append("\n═══ MONEY OWED TO USER (Lending) ═══\n");
        if (pendingLending.isEmpty() && partialLending.isEmpty()) {
            sb.append("No pending collections.\n");
        } else {
            sb.append("Total pending collection: ₹")
                    .append(String.format("%.0f",
                            totalPendingCollection + totalPartialCollection))
                    .append("\n");
            for (LendingReminder l : pendingLending) {
                long daysLeft = l.getDueDate() != null ?
                        java.time.temporal.ChronoUnit.DAYS.between(
                                java.time.LocalDate.now(), l.getDueDate()) : 0;
                sb.append("- ").append(l.getPersonName())
                        .append(" owes ₹").append(String.format("%.0f",
                                l.getAmount().doubleValue()))
                        .append(daysLeft < 0 ? " (OVERDUE by " + Math.abs(daysLeft) + " days)" :
                                daysLeft == 0 ? " (Due TODAY)" :
                                        " (Due in " + daysLeft + " days)")
                        .append("\n");
            }
            for (LendingReminder l : partialLending) {
                double pendingAmt = l.getAmount().doubleValue() -
                        l.getAmountReceived().doubleValue();
                sb.append("- ").append(l.getPersonName())
                        .append(" partially paid, still owes ₹")
                        .append(String.format("%.0f", pendingAmt)).append("\n");
            }
        }

        // AI Role Instructions
        sb.append("""

═══ YOUR ROLE AS FINANCIAL ADVISOR ═══
You have complete access to this user's financial data including:
loans, expenses by category, budgets, savings goals, and lending records.

When giving advice:
1. LOANS: Recommend Avalanche (highest rate first) OR Snowball (smallest balance first).
   Calculate exactly how extra payments reduce tenure and interest — show the math.
2. BUDGETS: Point out which categories are over/near budget and suggest cuts.
3. SAVINGS GOALS: Check if user is on track. Calculate monthly amount needed.
4. EXPENSES: Identify top spending categories. Suggest specific cuts in rupees.
5. LENDING: If collections are due, factor that into available cash flow.
6. ACTION PLAN: Always end with a specific monthly action plan like:
   "Cut Entertainment by ₹1,000 + Food by ₹500 = ₹1,500 extra on Personal Loan
    → saves ₹18,400 interest, closes 8 months early"
7. Be encouraging, specific, and always use Indian Rupee (₹) amounts.
8. Use bullet points for clarity. Keep responses concise but complete.
9. If no loans exist, focus on savings goals and budget optimization.
10. Consider lending collections as potential extra cash for loan repayment.
""");

        return sb.toString();
    }
}