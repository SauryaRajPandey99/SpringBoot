package com.example.consultantmanagement.dto;

public record ImportRowResultResponse(
        int rowNumber,
        String status,
        String message,
        String name,
        String email) {
}
