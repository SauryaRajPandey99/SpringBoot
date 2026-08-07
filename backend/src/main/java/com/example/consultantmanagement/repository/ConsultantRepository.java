package com.example.consultantmanagement.repository;

import java.time.LocalDateTime;
import java.util.Optional;

import com.example.consultantmanagement.entity.Consultant;
import com.example.consultantmanagement.entity.ConsultantStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConsultantRepository extends JpaRepository<Consultant, Long> {

    Page<Consultant> findByNameContainingIgnoreCaseOrTechnologyContainingIgnoreCase(
            String name,
            String technology,
            Pageable pageable);

    Optional<Consultant> findByEmailIgnoreCase(String email);

    Optional<Consultant> findByNameIgnoreCase(String name);

    Optional<Consultant> findByPhone(String phone);

    long countByStatus(ConsultantStatus status);

    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
}
