package com.example.consultantmanagement.dto;

import java.time.LocalDate;
import java.util.List;

public record DashboardStatsResponse(
        LocalDate today,
        long totalConsultants,
        long addedToday,
        long newThisMonth,
        long activeConsultants,
        long inactiveConsultants,
        List<DistributionItemResponse> technologyDistribution,
        List<DistributionItemResponse> experienceDistribution,
        List<ConsultantResponse> recentAdditions) {
}
