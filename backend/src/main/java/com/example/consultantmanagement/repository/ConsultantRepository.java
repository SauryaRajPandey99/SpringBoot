package com.example.consultantmanagement.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import com.example.consultantmanagement.entity.Consultant;
import com.example.consultantmanagement.entity.ConsultantStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ConsultantRepository extends JpaRepository<Consultant, Long>, JpaSpecificationExecutor<Consultant> {

    Optional<Consultant> findByEmailIgnoreCase(String email);

    Optional<Consultant> findByNameIgnoreCase(String name);

    Optional<Consultant> findByPhone(String phone);

    long countByStatus(ConsultantStatus status);

    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    List<Consultant> findTop5ByOrderByCreatedAtDescIdDesc();
}
