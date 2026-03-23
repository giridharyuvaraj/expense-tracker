package com.expensetracker.filter;

import com.expensetracker.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    public JwtAuthFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        String uri = request.getRequestURI();
        String method = request.getMethod();

        // Skip OPTIONS preflight
        if ("OPTIONS".equalsIgnoreCase(method)) {
            response.setStatus(HttpServletResponse.SC_OK);
            filterChain.doFilter(request, response);
            return;
        }

        // Skip public auth endpoints
        if (uri.startsWith("/api/auth/")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String authHeader = request.getHeader("Authorization");

        // No token — pass along, Spring Security handles 403
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.out.println("⚠️ No Bearer token for: " + method + " " + uri);
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt = authHeader.substring(7);
        String userEmail = null;

        try {
            userEmail = jwtUtil.extractEmail(jwt);
        } catch (Exception e) {
            System.out.println("❌ JWT parse error: " + e.getMessage());
            sendUnauthorized(response, "Invalid token");
            return;
        }

        if (userEmail != null
                && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                if (jwtUtil.validateToken(jwt)) {
                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(
                                    userEmail, null, new ArrayList<>());
                    authToken.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    System.out.println("✅ Authenticated: " + userEmail + " → " + uri);
                } else {
                    // Token expired — return 401 so frontend redirects to login
                    System.out.println("⏰ Token expired for: " + userEmail);
                    sendUnauthorized(response, "Token expired. Please login again.");
                    return;
                }
            } catch (Exception e) {
                System.out.println("❌ JWT auth error: " + e.getMessage());
                sendUnauthorized(response, "Authentication failed");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    // ─── Helper: write 401 JSON response ─────────────────────────────────────
    private void sendUnauthorized(HttpServletResponse response, String message)
            throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.getWriter().write("{\"error\": \"" + message + "\"}");
    }
}