package com.example.consultantmanagement.dto;

import java.time.LocalDateTime;

import com.example.consultantmanagement.entity.Consultant;
import com.example.consultantmanagement.entity.ConsultantStatus;

public record ConsultantResponse(
        Long id,
        String name,
        String email,
        String phone,
        String technology,
        Integer experience,
        ConsultantStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {

    public static ConsultantResponse from(Consultant consultant) {
        return new ConsultantResponse(
                consultant.getId(),
                consultant.getName(),
                consultant.getEmail(),
                consultant.getPhone(),
                consultant.getTechnology(),
                consultant.getExperience(),
                consultant.getStatus(),
                consultant.getCreatedAt(),
                consultant.getUpdatedAt());
    }
}

