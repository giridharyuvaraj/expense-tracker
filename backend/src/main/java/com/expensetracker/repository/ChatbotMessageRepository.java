package com.expensetracker.repository;

import com.expensetracker.entity.ChatbotMessage;
import com.expensetracker.entity.ChatbotSession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ChatbotMessageRepository extends JpaRepository<ChatbotMessage, Long> {
    List<ChatbotMessage> findBySessionOrderByCreatedAtAsc(ChatbotSession session);
}
