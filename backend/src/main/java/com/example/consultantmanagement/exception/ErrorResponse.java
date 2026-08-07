package com.example.consultantmanagement.exception;

import java.time.LocalDateTime;
import java.util.Map;

public record ErrorResponse(
        LocalDateTime timestamp,
        int status,
        String error,
        String message,
        Map<String, String> fieldErrors) {

    public static ErrorResponse of(int status, String error, String message) {
        return new ErrorResponse(LocalDateTime.now(), status, error, message, Map.of());
    }

    public static ErrorResponse withFieldErrors(
            int status,
            String error,
            String message,
            Map<String, String> fieldErrors) {
        return new ErrorResponse(LocalDateTime.now(), status, error, message, fieldErrors);
    }
}

