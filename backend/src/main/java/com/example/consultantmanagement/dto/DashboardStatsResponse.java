package com.example.consultantmanagement.dto;

public record DashboardStatsResponse(
        long totalConsultants,
        long newThisMonth,
        long activeConsultants,
        long inactiveConsultants) {
}

