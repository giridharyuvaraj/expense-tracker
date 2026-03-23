package com.expensetracker.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.function.Function;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiry}")
    private Long expiry;

    // ─── Reusable signing key ─────────────────────────────────────────────────
    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    // ─── Generate token ───────────────────────────────────────────────────────
    public String generateToken(String email) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(now + expiry))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // ─── Extract email ────────────────────────────────────────────────────────
    public String extractEmail(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    // ─── Extract expiration ───────────────────────────────────────────────────
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    // ─── Extract any claim ────────────────────────────────────────────────────
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        return claimsResolver.apply(extractAllClaims(token));
    }

    // ─── Parse all claims ─────────────────────────────────────────────────────
    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // ─── Validate token ───────────────────────────────────────────────────────
    public Boolean validateToken(String token) {
        try {
            extractAllClaims(token); // throws ExpiredJwtException if expired
            return !isTokenExpired(token);
        } catch (ExpiredJwtException e) {
            System.out.println("⏰ Token expired: " + e.getMessage());
            return false;
        } catch (Exception e) {
            System.out.println("❌ Token invalid: " + e.getMessage());
            return false;
        }
    }

    // ─── Check expiry ─────────────────────────────────────────────────────────
    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }
}