package com.expensetracker.controller;

import com.expensetracker.dto.request.ChatMessageRequest;
import com.expensetracker.dto.response.ApiResponse;
import com.expensetracker.entity.ChatbotMessage;
import com.expensetracker.entity.ChatbotSession;
import com.expensetracker.service.ChatbotService;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chatbot")
public class ChatbotController {

    private final ChatbotService chatbotService;

    public ChatbotController(ChatbotService chatbotService) {
        this.chatbotService = chatbotService;
    }

    // ─── Create new session ───────────────────────────────────────────────────
    @PostMapping("/session")
    public ResponseEntity<ApiResponse> createSession() {
        try {
            ChatbotSession session = chatbotService.createSession();
            System.out.println("✅ Session created: ID=" + session.getId());
            return ResponseEntity.ok(ApiResponse.success("Session created", session));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to create session: " + e.getMessage()));
        }
    }

    // ─── Send message — NO @Valid to avoid 400 errors ────────────────────────
    @PostMapping("/message")
    public ResponseEntity<ApiResponse> sendMessage(
            @RequestBody ChatMessageRequest request) {
        try {
            System.out.println("📨 Received - sessionId: "
                    + request.getSessionId()
                    + ", message: " + request.getMessage());

            // Manual validation instead of @Valid
            if (request.getSessionId() == null) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Session ID is required"));
            }
            if (request.getMessage() == null
                    || request.getMessage().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Message cannot be empty"));
            }

            String reply = chatbotService.chat(
                    request.getSessionId(),
                    request.getMessage());

            return ResponseEntity.ok(
                    ApiResponse.success("Reply received",
                            Map.of("reply", reply)));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(
                            "Failed to process message: " + e.getMessage()));
        }
    }

    // ─── Get messages for a session ───────────────────────────────────────────
    @GetMapping("/sessions/{sessionId}/messages")
    public ResponseEntity<ApiResponse> getSessionMessages(
            @PathVariable Long sessionId) {
        try {
            System.out.println("📋 Loading messages for session: " + sessionId);
            List<ChatbotMessage> messages =
                    chatbotService.getSessionMessages(sessionId);
            System.out.println("✅ Found " + messages.size() + " messages");
            return ResponseEntity.ok(
                    ApiResponse.success("Messages fetched", messages));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(
                            "Session not found: " + e.getMessage()));
        }
    }

    // ─── Get all sessions for current user ───────────────────────────────────
    @GetMapping("/sessions")
    public ResponseEntity<ApiResponse> getSessions() {
        try {
            List<ChatbotSession> sessions = chatbotService.getSessions();
            return ResponseEntity.ok(
                    ApiResponse.success("Sessions fetched", sessions));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(
                            "Failed to fetch sessions: " + e.getMessage()));
        }
    }
}