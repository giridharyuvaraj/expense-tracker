package com.expensetracker.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private final ConcurrentHashMap<String, AtomicInteger> requestCounts = new ConcurrentHashMap<>();
    private final long TIME_WINDOW_MS = 60000; // 1 minute
    private final int MAX_REQUESTS = 100;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String clientIp = request.getRemoteAddr();
        requestCounts.putIfAbsent(clientIp, new AtomicInteger(0));
        int count = requestCounts.get(clientIp).incrementAndGet();

        if (count > MAX_REQUESTS) {
            response.setStatus(429);
            response.getWriter().write("Too Many Requests");
            return;
        }

        // Simple cleanup: reset counts every minute (ideally use a scheduled task or a more robust library like Bucket4j)
        new Thread(() -> {
            try {
                Thread.sleep(TIME_WINDOW_MS);
                requestCounts.remove(clientIp);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }).start();

        filterChain.doFilter(request, response);
    }
}
