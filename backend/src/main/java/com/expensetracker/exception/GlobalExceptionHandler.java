package com.expensetracker.exception;

import com.expensetracker.dto.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // Handle wrong password / email
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse> handleBadCredentials(
            BadCredentialsException e) {
        return ResponseEntity.badRequest()
                .body(ApiResponse.error(
                        "Invalid email or password. Please try again."));
    }

    // Handle user not found
    @ExceptionHandler(UsernameNotFoundException.class)
    public ResponseEntity<ApiResponse> handleUserNotFound(
            UsernameNotFoundException e) {
        return ResponseEntity.badRequest()
                .body(ApiResponse.error(
                        "No account found with this email."));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiResponse> handleRuntimeException(
            RuntimeException e) {
        e.printStackTrace();
        return ResponseEntity.badRequest()
                .body(ApiResponse.error(e.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse> handleException(Exception e) {
        e.printStackTrace();
        return ResponseEntity.internalServerError()
                .body(ApiResponse.error(
                        "An unexpected error occurred: " + e.getMessage()));
    }
}