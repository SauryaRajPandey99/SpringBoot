package com.example.consultantmanagement.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Set;

import com.example.consultantmanagement.dto.ConsultantRequest;
import com.example.consultantmanagement.dto.ConsultantResponse;
import com.example.consultantmanagement.dto.DashboardStatsResponse;
import com.example.consultantmanagement.entity.Consultant;
import com.example.consultantmanagement.entity.ConsultantStatus;
import com.example.consultantmanagement.exception.DuplicateConsultantException;
import com.example.consultantmanagement.exception.ResourceNotFoundException;
import com.example.consultantmanagement.repository.ConsultantRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@Transactional
public class ConsultantService {

    private static final int MAX_PAGE_SIZE = 50;
    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "id",
            "name",
            "email",
            "technology",
            "experience",
            "status",
            "createdAt");

    private final ConsultantRepository consultantRepository;

    public ConsultantService(ConsultantRepository consultantRepository) {
        this.consultantRepository = consultantRepository;
    }

    @Transactional(readOnly = true)
    public Page<ConsultantResponse> findConsultants(
            String search,
            int page,
            int size,
            String sortBy,
            String direction) {
        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.min(Math.max(size, 1), MAX_PAGE_SIZE),
                buildSort(sortBy, direction));

        Page<Consultant> consultants = StringUtils.hasText(search)
                ? consultantRepository.findByNameContainingIgnoreCaseOrTechnologyContainingIgnoreCase(
                        search.trim(),
                        search.trim(),
                        pageable)
                : consultantRepository.findAll(pageable);

        return consultants.map(ConsultantResponse::from);
    }

    @Transactional(readOnly = true)
    public ConsultantResponse getConsultant(Long id) {
        return ConsultantResponse.from(findConsultantEntity(id));
    }

    public ConsultantResponse createConsultant(ConsultantRequest request) {
        validateConsultantIsUnique(null, request);

        Consultant consultant = new Consultant();
        applyRequest(consultant, request);
        return ConsultantResponse.from(consultantRepository.save(consultant));
    }

    public ConsultantResponse updateConsultant(Long id, ConsultantRequest request) {
        Consultant consultant = findConsultantEntity(id);

        validateConsultantIsUnique(id, request);

        applyRequest(consultant, request);
        return ConsultantResponse.from(consultantRepository.save(consultant));
    }

    public void deleteConsultant(Long id) {
        Consultant consultant = findConsultantEntity(id);
        consultantRepository.delete(consultant);
    }

    @Transactional(readOnly = true)
    public DashboardStatsResponse getDashboardStats() {
        LocalDateTime monthStart = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime now = LocalDateTime.now();

        return new DashboardStatsResponse(
                consultantRepository.count(),
                consultantRepository.countByCreatedAtBetween(monthStart, now),
                consultantRepository.countByStatus(ConsultantStatus.ACTIVE),
                consultantRepository.countByStatus(ConsultantStatus.INACTIVE));
    }

    private Consultant findConsultantEntity(Long id) {
        return consultantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Consultant not found with id " + id + "."));
    }

    private void applyRequest(Consultant consultant, ConsultantRequest request) {
        consultant.setName(request.getName().trim());
        consultant.setEmail(normalizeEmail(request.getEmail()));
        consultant.setPhone(request.getPhone().trim());
        consultant.setTechnology(request.getTechnology().trim());
        consultant.setExperience(request.getExperience());
        consultant.setStatus(request.getStatus());
    }

    private void validateConsultantIsUnique(Long currentConsultantId, ConsultantRequest request) {
        boolean duplicateExists = consultantRepository.findByNameIgnoreCase(request.getName().trim())
                .filter(existing -> belongsToAnotherConsultant(existing, currentConsultantId))
                .isPresent()
                || consultantRepository.findByEmailIgnoreCase(normalizeEmail(request.getEmail()))
                .filter(existing -> belongsToAnotherConsultant(existing, currentConsultantId))
                .isPresent()
                || consultantRepository.findByPhone(request.getPhone().trim())
                .filter(existing -> belongsToAnotherConsultant(existing, currentConsultantId))
                .isPresent();

        if (duplicateExists) {
            throw new DuplicateConsultantException(
                    "This user already exists in the database. Name, email, and phone must be unique.");
        }
    }

    private boolean belongsToAnotherConsultant(Consultant consultant, Long currentConsultantId) {
        return currentConsultantId == null || !consultant.getId().equals(currentConsultantId);
    }

    private Sort buildSort(String sortBy, String direction) {
        String safeSortBy = ALLOWED_SORT_FIELDS.contains(String.valueOf(sortBy)) ? sortBy : "name";
        Sort.Direction safeDirection = "desc".equalsIgnoreCase(direction)
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;

        return Sort.by(safeDirection, safeSortBy).and(Sort.by(Sort.Direction.ASC, "id"));
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
