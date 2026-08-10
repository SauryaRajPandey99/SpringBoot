package com.example.consultantmanagement.service;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import com.example.consultantmanagement.dto.ConsultantRequest;
import com.example.consultantmanagement.dto.ConsultantResponse;
import com.example.consultantmanagement.dto.DashboardStatsResponse;
import com.example.consultantmanagement.dto.DistributionItemResponse;
import com.example.consultantmanagement.dto.ImportRowResultResponse;
import com.example.consultantmanagement.dto.ImportSummaryResponse;
import com.example.consultantmanagement.entity.Consultant;
import com.example.consultantmanagement.entity.ConsultantStatus;
import com.example.consultantmanagement.exception.DuplicateConsultantException;
import com.example.consultantmanagement.exception.ResourceNotFoundException;
import com.example.consultantmanagement.repository.ConsultantRepository;
import jakarta.persistence.criteria.Predicate;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import org.apache.poi.EncryptedDocumentException;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

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
    private final Validator validator;

    public ConsultantService(ConsultantRepository consultantRepository, Validator validator) {
        this.consultantRepository = consultantRepository;
        this.validator = validator;
    }

    @Transactional(readOnly = true)
    public Page<ConsultantResponse> findConsultants(
            String search,
            int page,
            int size,
            String sortBy,
            String direction,
            String status,
            String technology,
            String experienceRange) {
        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.min(Math.max(size, 1), MAX_PAGE_SIZE),
                buildSort(sortBy, direction));

        Specification<Consultant> specification = buildSpecification(search, status, technology, experienceRange);

        return consultantRepository.findAll(specification, pageable)
                .map(ConsultantResponse::from);
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

    public ImportSummaryResponse importConsultants(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Upload a valid Excel file.");
        }

        String originalFilename = String.valueOf(file.getOriginalFilename()).toLowerCase(Locale.ROOT);
        if (!originalFilename.endsWith(".xlsx") && !originalFilename.endsWith(".xls")) {
            throw new IllegalArgumentException("Only Excel files with .xlsx or .xls extension are supported.");
        }

        try (InputStream inputStream = file.getInputStream();
                Workbook workbook = WorkbookFactory.create(inputStream)) {
            return importWorkbook(workbook);
        } catch (EncryptedDocumentException exception) {
            throw new IllegalArgumentException("The Excel file is password protected and cannot be imported.");
        } catch (IOException exception) {
            throw new IllegalArgumentException("Unable to read the Excel file. Please check the file format.");
        }
    }

    @Transactional(readOnly = true)
    public DashboardStatsResponse getDashboardStats() {
        LocalDate today = LocalDate.now();
        LocalDateTime todayStart = today.atStartOfDay();
        LocalDateTime tomorrowStart = today.plusDays(1).atStartOfDay();
        LocalDateTime monthStart = today.withDayOfMonth(1).atStartOfDay();

        List<Consultant> consultants = consultantRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        List<ConsultantResponse> recentAdditions = consultantRepository.findTop5ByOrderByCreatedAtDescIdDesc()
                .stream()
                .map(ConsultantResponse::from)
                .toList();

        return new DashboardStatsResponse(
                today,
                consultantRepository.count(),
                consultantRepository.countByCreatedAtBetween(todayStart, tomorrowStart),
                consultantRepository.countByCreatedAtBetween(monthStart, tomorrowStart),
                consultantRepository.countByStatus(ConsultantStatus.ACTIVE),
                consultantRepository.countByStatus(ConsultantStatus.INACTIVE),
                buildTechnologyDistribution(consultants),
                buildExperienceDistribution(consultants),
                recentAdditions);
    }

    private ImportSummaryResponse importWorkbook(Workbook workbook) {
        if (workbook.getNumberOfSheets() == 0) {
            throw new IllegalArgumentException("The Excel file does not contain any sheets.");
        }

        Sheet sheet = workbook.getSheetAt(0);
        DataFormatter formatter = new DataFormatter();
        Set<String> importedNames = new HashSet<>();
        Set<String> importedEmails = new HashSet<>();
        Set<String> importedPhones = new HashSet<>();
        List<ImportRowResultResponse> results = new ArrayList<>();
        int totalRows = 0;
        int added = 0;
        int skippedDuplicates = 0;
        int failedValidation = 0;

        for (Row row : sheet) {
            if (row.getRowNum() == 0 && isHeaderRow(row, formatter)) {
                continue;
            }

            if (isBlankRow(row, formatter)) {
                continue;
            }

            totalRows++;
            ParsedImportRow parsedRow = parseImportRow(row, formatter);

            if (parsedRow.errorMessage() != null) {
                failedValidation++;
                results.add(new ImportRowResultResponse(
                        row.getRowNum() + 1,
                        "FAILED",
                        parsedRow.errorMessage(),
                        parsedRow.name(),
                        parsedRow.email()));
                continue;
            }

            ConsultantRequest request = parsedRow.request();
            Set<ConstraintViolation<ConsultantRequest>> violations = validator.validate(request);
            if (!violations.isEmpty()) {
                failedValidation++;
                results.add(new ImportRowResultResponse(
                        row.getRowNum() + 1,
                        "FAILED",
                        formatValidationErrors(violations),
                        request.getName(),
                        request.getEmail()));
                continue;
            }

            List<String> duplicateFields = findDuplicateFields(request, importedNames, importedEmails, importedPhones);
            if (!duplicateFields.isEmpty()) {
                skippedDuplicates++;
                results.add(new ImportRowResultResponse(
                        row.getRowNum() + 1,
                        "DUPLICATE",
                        "Skipped duplicate " + String.join(", ", duplicateFields) + ".",
                        request.getName(),
                        request.getEmail()));
                continue;
            }

            Consultant consultant = new Consultant();
            applyRequest(consultant, request);
            consultantRepository.save(consultant);
            rememberImportedKeys(request, importedNames, importedEmails, importedPhones);
            added++;
            results.add(new ImportRowResultResponse(
                    row.getRowNum() + 1,
                    "ADDED",
                    "Imported successfully.",
                    request.getName(),
                    request.getEmail()));
        }

        return new ImportSummaryResponse(totalRows, added, skippedDuplicates, failedValidation, results);
    }

    private Specification<Consultant> buildSpecification(
            String search,
            String status,
            String technology,
            String experienceRange) {
        String searchTerm = StringUtils.hasText(search) ? search.trim().toLowerCase(Locale.ROOT) : "";
        String technologyTerm = StringUtils.hasText(technology) ? technology.trim().toLowerCase(Locale.ROOT) : "";
        ConsultantStatus selectedStatus = parseStatusFilter(status);
        ExperienceBounds bounds = parseExperienceRange(experienceRange);

        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(searchTerm)) {
                String pattern = "%" + searchTerm + "%";
                List<Predicate> searchPredicates = new ArrayList<>();
                searchPredicates.add(criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), pattern));
                searchPredicates.add(criteriaBuilder.like(criteriaBuilder.lower(root.get("email")), pattern));
                searchPredicates.add(criteriaBuilder.like(criteriaBuilder.lower(root.get("phone")), pattern));
                searchPredicates.add(criteriaBuilder.like(criteriaBuilder.lower(root.get("technology")), pattern));

                try {
                    searchPredicates.add(criteriaBuilder.equal(root.get("id"), Long.parseLong(searchTerm)));
                } catch (NumberFormatException ignored) {
                    // Non-numeric search terms simply skip the id predicate.
                }

                predicates.add(criteriaBuilder.or(searchPredicates.toArray(Predicate[]::new)));
            }

            if (selectedStatus != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), selectedStatus));
            }

            if (StringUtils.hasText(technologyTerm)) {
                predicates.add(criteriaBuilder.like(criteriaBuilder.lower(root.get("technology")), "%" + technologyTerm + "%"));
            }

            if (bounds != null) {
                if (bounds.max() == null) {
                    predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("experience"), bounds.min()));
                } else {
                    predicates.add(criteriaBuilder.between(root.get("experience"), bounds.min(), bounds.max()));
                }
            }

            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };
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

    private List<String> findDuplicateFields(
            ConsultantRequest request,
            Set<String> importedNames,
            Set<String> importedEmails,
            Set<String> importedPhones) {
        List<String> duplicates = new ArrayList<>();
        String name = request.getName().trim();
        String email = normalizeEmail(request.getEmail());
        String phone = request.getPhone().trim();

        if (importedNames.contains(name.toLowerCase(Locale.ROOT)) || consultantRepository.findByNameIgnoreCase(name).isPresent()) {
            duplicates.add("name");
        }

        if (importedEmails.contains(email) || consultantRepository.findByEmailIgnoreCase(email).isPresent()) {
            duplicates.add("email");
        }

        if (importedPhones.contains(phone) || consultantRepository.findByPhone(phone).isPresent()) {
            duplicates.add("phone");
        }

        return duplicates;
    }

    private void rememberImportedKeys(
            ConsultantRequest request,
            Set<String> importedNames,
            Set<String> importedEmails,
            Set<String> importedPhones) {
        importedNames.add(request.getName().trim().toLowerCase(Locale.ROOT));
        importedEmails.add(normalizeEmail(request.getEmail()));
        importedPhones.add(request.getPhone().trim());
    }

    private List<DistributionItemResponse> buildTechnologyDistribution(List<Consultant> consultants) {
        Map<String, String> labels = new HashMap<>();
        Map<String, Long> counts = new HashMap<>();

        for (Consultant consultant : consultants) {
            String[] technologies = consultant.getTechnology().split("[,;/|]");
            for (String technology : technologies) {
                String label = normalizeTechnologyLabel(technology);
                if (!StringUtils.hasText(label)) {
                    continue;
                }
                String key = label.toLowerCase(Locale.ROOT);
                labels.putIfAbsent(key, label);
                counts.merge(key, 1L, Long::sum);
            }
        }

        return counts.entrySet()
                .stream()
                .map(entry -> new DistributionItemResponse(labels.get(entry.getKey()), entry.getValue()))
                .sorted((left, right) -> {
                    int countCompare = Long.compare(right.count(), left.count());
                    return countCompare != 0 ? countCompare : left.label().compareToIgnoreCase(right.label());
                })
                .toList();
    }

    private List<DistributionItemResponse> buildExperienceDistribution(List<Consultant> consultants) {
        Map<String, Long> counts = new LinkedHashMap<>();
        counts.put("0-2 years", 0L);
        counts.put("3-5 years", 0L);
        counts.put("6-8 years", 0L);
        counts.put("9+ years", 0L);

        for (Consultant consultant : consultants) {
            counts.merge(getExperienceRange(consultant.getExperience()), 1L, Long::sum);
        }

        return counts.entrySet()
                .stream()
                .map(entry -> new DistributionItemResponse(entry.getKey(), entry.getValue()))
                .toList();
    }

    private ParsedImportRow parseImportRow(Row row, DataFormatter formatter) {
        String name = readCell(row, 0, formatter);
        String email = readCell(row, 1, formatter);
        String phone = readCell(row, 2, formatter);
        String technology = readCell(row, 3, formatter);
        String experienceValue = readCell(row, 4, formatter);
        String statusValue = readCell(row, 5, formatter);

        ConsultantRequest request = new ConsultantRequest();
        request.setName(name);
        request.setEmail(email);
        request.setPhone(phone);
        request.setTechnology(technology);

        try {
            request.setExperience(parseExperience(experienceValue));
        } catch (IllegalArgumentException exception) {
            return new ParsedImportRow(null, exception.getMessage(), name, email);
        }

        try {
            request.setStatus(parseStatus(statusValue));
        } catch (IllegalArgumentException exception) {
            return new ParsedImportRow(null, exception.getMessage(), name, email);
        }

        return new ParsedImportRow(request, null, name, email);
    }

    private Integer parseExperience(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }

        try {
            double parsed = Double.parseDouble(value.trim());
            int years = (int) parsed;
            if (parsed != years) {
                throw new IllegalArgumentException("Experience must be a whole number.");
            }
            return years;
        } catch (NumberFormatException exception) {
            throw new IllegalArgumentException("Experience must be a valid number.");
        }
    }

    private ConsultantStatus parseStatus(String value) {
        if (!StringUtils.hasText(value)) {
            return ConsultantStatus.ACTIVE;
        }

        try {
            return ConsultantStatus.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Status must be ACTIVE or INACTIVE.");
        }
    }

    private ConsultantStatus parseStatusFilter(String value) {
        if (!StringUtils.hasText(value) || "all".equalsIgnoreCase(value.trim())) {
            return null;
        }
        return parseStatus(value);
    }

    private ExperienceBounds parseExperienceRange(String value) {
        if (!StringUtils.hasText(value) || "all".equalsIgnoreCase(value.trim())) {
            return null;
        }

        String normalized = value.trim().toLowerCase(Locale.ROOT).replace(" years", "");
        return switch (normalized) {
            case "0-2" -> new ExperienceBounds(0, 2);
            case "3-5" -> new ExperienceBounds(3, 5);
            case "6-8" -> new ExperienceBounds(6, 8);
            case "9+" -> new ExperienceBounds(9, null);
            default -> throw new IllegalArgumentException("Experience range filter must be 0-2, 3-5, 6-8, or 9+.");
        };
    }

    private String readCell(Row row, int columnIndex, DataFormatter formatter) {
        Cell cell = row.getCell(columnIndex, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        return cell == null ? "" : formatter.formatCellValue(cell).trim();
    }

    private boolean isHeaderRow(Row row, DataFormatter formatter) {
        String firstCell = readCell(row, 0, formatter).toLowerCase(Locale.ROOT);
        String secondCell = readCell(row, 1, formatter).toLowerCase(Locale.ROOT);
        return firstCell.contains("name") && secondCell.contains("email");
    }

    private boolean isBlankRow(Row row, DataFormatter formatter) {
        for (int index = 0; index < 6; index++) {
            if (StringUtils.hasText(readCell(row, index, formatter))) {
                return false;
            }
        }
        return true;
    }

    private String formatValidationErrors(Set<ConstraintViolation<ConsultantRequest>> violations) {
        return violations.stream()
                .map(violation -> violation.getPropertyPath() + ": " + violation.getMessage())
                .sorted()
                .collect(Collectors.joining("; "));
    }

    private String normalizeTechnologyLabel(String value) {
        String trimmed = value.trim();
        if (!StringUtils.hasText(trimmed)) {
            return "";
        }

        String[] words = trimmed.split("\\s+");
        List<String> normalizedWords = new ArrayList<>();
        for (String word : words) {
            if (word.length() <= 1 || word.equals(word.toUpperCase(Locale.ROOT))) {
                normalizedWords.add(word);
            } else {
                normalizedWords.add(word.substring(0, 1).toUpperCase(Locale.ROOT) + word.substring(1));
            }
        }
        return String.join(" ", normalizedWords);
    }

    private String getExperienceRange(Integer years) {
        if (years == null || years <= 2) {
            return "0-2 years";
        }
        if (years <= 5) {
            return "3-5 years";
        }
        if (years <= 8) {
            return "6-8 years";
        }
        return "9+ years";
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

    private record ParsedImportRow(
            ConsultantRequest request,
            String errorMessage,
            String name,
            String email) {
    }

    private record ExperienceBounds(
            Integer min,
            Integer max) {
    }
}
