package com.expensetracker.repository;

import com.expensetracker.entity.ChatbotSession;
import com.expensetracker.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ChatbotSessionRepository extends JpaRepository<ChatbotSession, Long> {
    List<ChatbotSession> findByUserOrderByCreatedAtDesc(User user);
}
