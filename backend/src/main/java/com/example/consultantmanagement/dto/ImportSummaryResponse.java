package com.example.consultantmanagement.dto;

import java.util.List;

public record ImportSummaryResponse(
        int totalRows,
        int added,
        int skippedDuplicates,
        int failedValidation,
        List<ImportRowResultResponse> rows,
        List<ConsultantResponse> uploadedConsultants) {
}
