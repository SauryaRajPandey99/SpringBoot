package com.example.consultantmanagement.service;

import java.io.ByteArrayOutputStream;
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
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import com.example.consultantmanagement.dto.ConsultantRequest;
import com.example.consultantmanagement.dto.ConsultantResponse;
import com.example.consultantmanagement.dto.DashboardStatsResponse;
import com.example.consultantmanagement.dto.DistributionItemResponse;
import com.example.consultantmanagement.dto.ImportRowResultResponse;
import com.example.consultantmanagement.dto.ImportSummaryResponse;
import com.example.consultantmanagement.entity.Consultant;
import com.example.consultantmanagement.entity.ConsultantStatus;
import com.example.consultantmanagement.entity.OnboardingSource;
import com.example.consultantmanagement.exception.DuplicateConsultantException;
import com.example.consultantmanagement.exception.ResourceNotFoundException;
import com.example.consultantmanagement.repository.ConsultantRepository;
import jakarta.persistence.criteria.Predicate;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import org.apache.poi.EncryptedDocumentException;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Service
@Transactional
public class ConsultantService {

    private static final int MAX_PAGE_SIZE = 50;
    private static final Pattern PDF_EMAIL_PATTERN = Pattern.compile(
            "([A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,})",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern PDF_PHONE_TECHNOLOGY_PATTERN = Pattern.compile("^([+\\d][+\\d\\s().-]{6,}\\d)\\s+(.+)$");
    private static final Pattern PDF_STATUS_PATTERN = Pattern.compile("\\b(ACTIVE|INACTIVE)\\b\\s*$", Pattern.CASE_INSENSITIVE);
    private static final Pattern PDF_EXPERIENCE_PATTERN = Pattern.compile("(\\d{1,2})(?:\\s*(?:years?|yrs?|yoe))?\\s*$", Pattern.CASE_INSENSITIVE);
    private static final String[] IMPORT_HEADERS = {
            "Name",
            "Email",
            "Phone",
            "Technology",
            "Experience",
            "Status"
    };
    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "id",
            "name",
            "email",
            "technology",
            "experience",
            "status",
            "createdAt",
            "importedAt",
            "onboardingSource");

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
    public Page<ConsultantResponse> findOnboardedConsultants(
            String source,
            String search,
            int page,
            int size,
            String sortBy,
            String direction) {
        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.min(Math.max(size, 1), MAX_PAGE_SIZE),
                buildSort(sortBy, direction));

        OnboardingSource selectedSource = parseOnboardingSource(source);
        String searchTerm = StringUtils.hasText(search) ? search.trim().toLowerCase(Locale.ROOT) : "";

        Specification<Consultant> specification = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (selectedSource == null) {
                predicates.add(root.get("onboardingSource").in(OnboardingSource.EXCEL, OnboardingSource.PDF));
            } else {
                predicates.add(criteriaBuilder.equal(root.get("onboardingSource"), selectedSource));
            }

            if (StringUtils.hasText(searchTerm)) {
                String pattern = "%" + searchTerm + "%";
                predicates.add(criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("email")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("technology")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("importFileName")), pattern)));
            }

            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };

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

    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public ImportSummaryResponse importConsultants(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Upload a valid Excel or PDF file.");
        }

        String originalFilename = String.valueOf(file.getOriginalFilename());
        String lowerFilename = originalFilename.toLowerCase(Locale.ROOT);
        if (!lowerFilename.endsWith(".xlsx") && !lowerFilename.endsWith(".xls") && !lowerFilename.endsWith(".pdf")) {
            throw new IllegalArgumentException("Only Excel (.xlsx, .xls) and PDF (.pdf) files are supported.");
        }

        if (lowerFilename.endsWith(".pdf")) {
            return importPdf(file, originalFilename);
        }

        try (InputStream inputStream = file.getInputStream();
                Workbook workbook = WorkbookFactory.create(inputStream)) {
            return importWorkbook(workbook, OnboardingSource.EXCEL, originalFilename);
        } catch (EncryptedDocumentException exception) {
            throw new IllegalArgumentException("The Excel file is password protected and cannot be imported.");
        } catch (IOException exception) {
            throw new IllegalArgumentException("Unable to read the Excel file. Please check the file format.");
        }
    }

    @Transactional(readOnly = true)
    public byte[] buildImportTemplate() {
        try (Workbook workbook = new XSSFWorkbook();
                ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Consultants");
            sheet.createFreezePane(0, 1);

            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);

            Row header = sheet.createRow(0);
            for (int index = 0; index < IMPORT_HEADERS.length; index++) {
                Cell cell = header.createCell(index);
                cell.setCellValue(IMPORT_HEADERS[index]);
                cell.setCellStyle(headerStyle);
                sheet.autoSizeColumn(index);
                sheet.setColumnWidth(index, Math.max(sheet.getColumnWidth(index), 4500));
            }

            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to create the Excel import template.");
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

    private ImportSummaryResponse importPdf(MultipartFile file, String originalFilename) {
        try (InputStream inputStream = file.getInputStream();
                PDDocument document = PDDocument.load(inputStream);
                Workbook workbook = new XSSFWorkbook()) {
            String text = new PDFTextStripper().getText(document);
            Sheet sheet = workbook.createSheet("PDF Import");
            Row header = sheet.createRow(0);
            for (int index = 0; index < IMPORT_HEADERS.length; index++) {
                header.createCell(index).setCellValue(IMPORT_HEADERS[index]);
            }

            List<String[]> rows = parsePdfConsultantRows(text);
            for (int rowIndex = 0; rowIndex < rows.size(); rowIndex++) {
                Row row = sheet.createRow(rowIndex + 1);
                String[] values = rows.get(rowIndex);
                for (int columnIndex = 0; columnIndex < values.length; columnIndex++) {
                    row.createCell(columnIndex).setCellValue(values[columnIndex]);
                }
            }

            return importWorkbook(workbook, OnboardingSource.PDF, originalFilename);
        } catch (IOException exception) {
            throw new IllegalArgumentException("Unable to read the PDF file. Use a text-based PDF with consultant rows.");
        }
    }

    private ImportSummaryResponse importWorkbook(Workbook workbook, OnboardingSource source, String originalFilename) {
        if (workbook.getNumberOfSheets() == 0) {
            throw new IllegalArgumentException("The uploaded file does not contain any readable rows.");
        }

        Sheet sheet = workbook.getSheetAt(0);
        DataFormatter formatter = new DataFormatter();
        ColumnMapping columnMapping = resolveColumnMapping(sheet, formatter);
        Set<String> importedNames = new HashSet<>();
        Set<String> importedEmails = new HashSet<>();
        Set<String> importedPhones = new HashSet<>();
        List<ImportRowResultResponse> results = new ArrayList<>();
        int totalRows = 0;
        int added = 0;
        int skippedDuplicates = 0;
        int failedValidation = 0;
        LocalDateTime importedAt = LocalDateTime.now();
        List<ConsultantResponse> uploadedConsultants = new ArrayList<>();
        Set<Long> uploadedConsultantIds = new HashSet<>();

        for (Row row : sheet) {
            if (row.getRowNum() <= columnMapping.headerRowIndex()) {
                continue;
            }

            if (isBlankRow(row, formatter)) {
                continue;
            }

            totalRows++;
            ParsedImportRow parsedRow = parseImportRow(row, formatter, columnMapping);

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
                findExistingConsultantForImport(request)
                        .map(consultant -> tagConsultantAsUploaded(consultant, source, originalFilename, importedAt))
                        .ifPresent(consultant -> addUploadedConsultant(uploadedConsultants, uploadedConsultantIds, consultant));
                results.add(new ImportRowResultResponse(
                        row.getRowNum() + 1,
                        "DUPLICATE",
                        "Skipped duplicate " + String.join(", ", duplicateFields) + ".",
                        request.getName(),
                        request.getEmail()));
                continue;
            }

            try {
                Consultant consultant = new Consultant();
                applyRequest(consultant, request);
                consultant.setOnboardingSource(source);
                consultant.setImportFileName(originalFilename);
                consultant.setImportedAt(importedAt);
                Consultant savedConsultant = consultantRepository.saveAndFlush(consultant);
                addUploadedConsultant(uploadedConsultants, uploadedConsultantIds, savedConsultant);
                rememberImportedKeys(request, importedNames, importedEmails, importedPhones);
                added++;
                results.add(new ImportRowResultResponse(
                        row.getRowNum() + 1,
                        "ADDED",
                        "Imported successfully.",
                        request.getName(),
                        request.getEmail()));
            } catch (DataIntegrityViolationException exception) {
                skippedDuplicates++;
                findExistingConsultantForImport(request)
                        .map(consultant -> tagConsultantAsUploaded(consultant, source, originalFilename, importedAt))
                        .ifPresent(consultant -> addUploadedConsultant(uploadedConsultants, uploadedConsultantIds, consultant));
                results.add(new ImportRowResultResponse(
                        row.getRowNum() + 1,
                        "DUPLICATE",
                        "Skipped because this row conflicts with an existing name, email, or phone.",
                        request.getName(),
                        request.getEmail()));
            } catch (RuntimeException exception) {
                failedValidation++;
                results.add(new ImportRowResultResponse(
                        row.getRowNum() + 1,
                        "FAILED",
                        "Could not save this row. Check the field values and try again.",
                        request.getName(),
                        request.getEmail()));
            }
        }

        return new ImportSummaryResponse(totalRows, added, skippedDuplicates, failedValidation, results, uploadedConsultants);
    }

    private Specification<Consultant> buildSpecification(
            String search,
            String status,
            String technology,
            String experienceRange) {
        String searchTerm = StringUtils.hasText(search) ? search.trim().toLowerCase(Locale.ROOT) : "";
        String technologyTerm = normalizeTechnologySearchTerm(technology);
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
        consultant.setPhone(normalizePhone(request.getPhone()));
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
                || consultantRepository.findByPhone(normalizePhone(request.getPhone()))
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
        String phone = normalizePhone(request.getPhone());

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
        importedPhones.add(normalizePhone(request.getPhone()));
    }

    private java.util.Optional<Consultant> findExistingConsultantForImport(ConsultantRequest request) {
        return consultantRepository.findByEmailIgnoreCase(normalizeEmail(request.getEmail()))
                .or(() -> consultantRepository.findByPhone(normalizePhone(request.getPhone())))
                .or(() -> consultantRepository.findByNameIgnoreCase(request.getName().trim()));
    }

    private Consultant tagConsultantAsUploaded(
            Consultant consultant,
            OnboardingSource source,
            String originalFilename,
            LocalDateTime importedAt) {
        consultant.setOnboardingSource(source);
        consultant.setImportFileName(originalFilename);
        consultant.setImportedAt(importedAt);
        return consultantRepository.saveAndFlush(consultant);
    }

    private void addUploadedConsultant(
            List<ConsultantResponse> uploadedConsultants,
            Set<Long> uploadedConsultantIds,
            Consultant consultant) {
        if (consultant.getId() != null && uploadedConsultantIds.add(consultant.getId())) {
            uploadedConsultants.add(ConsultantResponse.from(consultant));
        }
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

    private ParsedImportRow parseImportRow(Row row, DataFormatter formatter, ColumnMapping columnMapping) {
        String name = readCell(row, columnMapping.nameColumn(), formatter);
        String email = readCell(row, columnMapping.emailColumn(), formatter);
        String phone = readCell(row, columnMapping.phoneColumn(), formatter);
        String technology = readCell(row, columnMapping.technologyColumn(), formatter);
        String experienceValue = readCell(row, columnMapping.experienceColumn(), formatter);
        String statusValue = columnMapping.statusColumn() == null
                ? ""
                : readCell(row, columnMapping.statusColumn(), formatter);

        ConsultantRequest request = new ConsultantRequest();
        request.setName(name);
        request.setEmail(email);
        request.setPhone(normalizePhone(phone));
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

    private ColumnMapping resolveColumnMapping(Sheet sheet, DataFormatter formatter) {
        for (Row row : sheet) {
            if (isBlankRow(row, formatter)) {
                continue;
            }

            Map<String, Integer> headers = new HashMap<>();
            int lastCell = Math.max(row.getLastCellNum(), 0);
            for (int index = 0; index < lastCell; index++) {
                String header = normalizeHeader(readCell(row, index, formatter));
                if (StringUtils.hasText(header)) {
                    headers.putIfAbsent(header, index);
                }
            }

            Integer nameColumn = findHeaderIndex(headers, "name", "full name", "consultant name", "candidate name");
            Integer emailColumn = findHeaderIndex(headers, "email", "email id", "email address", "e mail", "e mail id");
            Integer phoneColumn = findHeaderIndex(headers, "phone", "phone number", "mobile", "mobile number", "contact", "contact number");
            Integer technologyColumn = findHeaderIndex(headers, "technology", "tech", "skill", "skills", "primary technology");
            Integer experienceColumn = findHeaderIndex(headers, "experience", "exp", "years of experience", "yoe");
            Integer statusColumn = findHeaderIndex(headers, "status", "active status", "availability");

            if (nameColumn != null
                    && emailColumn != null
                    && phoneColumn != null
                    && technologyColumn != null
                    && experienceColumn != null) {
                return new ColumnMapping(
                        row.getRowNum(),
                        nameColumn,
                        emailColumn,
                        phoneColumn,
                        technologyColumn,
                        experienceColumn,
                        statusColumn);
            }
        }

        return new ColumnMapping(-1, 0, 1, 2, 3, 4, 5);
    }

    private Integer findHeaderIndex(Map<String, Integer> headers, String... aliases) {
        for (String alias : aliases) {
            Integer index = headers.get(normalizeHeader(alias));
            if (index != null) {
                return index;
            }
        }
        return null;
    }

    private List<String[]> parsePdfConsultantRows(String text) {
        List<String[]> rows = new ArrayList<>();
        if (!StringUtils.hasText(text)) {
            return rows;
        }

        String[] lines = text.split("\\R");
        for (String line : lines) {
            String normalizedLine = line.replace('|', ' ').replaceAll("\\s+", " ").trim();
            if (!StringUtils.hasText(normalizedLine) || looksLikeHeaderLine(normalizedLine)) {
                continue;
            }

            Matcher emailMatcher = PDF_EMAIL_PATTERN.matcher(normalizedLine);
            if (!emailMatcher.find()) {
                continue;
            }

            String name = cleanupPdfName(normalizedLine.substring(0, emailMatcher.start()));
            String email = emailMatcher.group(1);
            String remaining = cleanupPdfValue(normalizedLine.substring(emailMatcher.end()));

            Matcher statusMatcher = PDF_STATUS_PATTERN.matcher(remaining);
            String status = "ACTIVE";
            if (statusMatcher.find()) {
                status = statusMatcher.group(1).toUpperCase(Locale.ROOT);
                remaining = cleanupPdfValue(remaining.substring(0, statusMatcher.start()));
            }

            Matcher experienceMatcher = PDF_EXPERIENCE_PATTERN.matcher(remaining);
            if (!experienceMatcher.find()) {
                continue;
            }
            String experience = experienceMatcher.group(1);
            remaining = cleanupPdfValue(remaining.substring(0, experienceMatcher.start()));

            PhoneTechnology phoneTechnology = splitPdfPhoneAndTechnology(remaining);
            if (phoneTechnology == null) {
                continue;
            }

            String phone = phoneTechnology.phone();
            String technology = phoneTechnology.technology();

            if (StringUtils.hasText(name)
                    && StringUtils.hasText(email)
                    && StringUtils.hasText(phone)
                    && StringUtils.hasText(technology)) {
                rows.add(new String[] { name, email, phone, technology, experience, status });
            }
        }

        return rows;
    }

    private PhoneTechnology splitPdfPhoneAndTechnology(String value) {
        Matcher matcher = PDF_PHONE_TECHNOLOGY_PATTERN.matcher(value);
        if (matcher.find()) {
            return new PhoneTechnology(
                    cleanupPdfValue(matcher.group(1)),
                    cleanupPdfValue(matcher.group(2)));
        }

        int technologyStart = firstLetterIndex(value);
        if (technologyStart <= 0) {
            return null;
        }

        while (technologyStart > 0 && ".#+".indexOf(value.charAt(technologyStart - 1)) >= 0) {
            technologyStart--;
        }

        return new PhoneTechnology(
                cleanupPdfValue(value.substring(0, technologyStart)),
                cleanupPdfValue(value.substring(technologyStart)));
    }

    private boolean looksLikeHeaderLine(String value) {
        String normalized = value.toLowerCase(Locale.ROOT);
        return normalized.contains("name")
                && normalized.contains("email")
                && normalized.contains("phone");
    }

    private int firstLetterIndex(String value) {
        for (int index = 0; index < value.length(); index++) {
            if (Character.isLetter(value.charAt(index))) {
                return index;
            }
        }
        return -1;
    }

    private String cleanupPdfValue(String value) {
        return value == null
                ? ""
                : value.replaceAll("^[\\s,;:-]+", "")
                        .replaceAll("[\\s,;:-]+$", "")
                        .trim();
    }

    private String cleanupPdfName(String value) {
        return value == null
                ? ""
                : value.replaceAll("^[#\\d\\s.,:-]+", "")
                        .replaceAll("[\\s,;:-]+$", "")
                        .trim();
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

    private OnboardingSource parseOnboardingSource(String value) {
        if (!StringUtils.hasText(value) || "all".equalsIgnoreCase(value.trim())) {
            return null;
        }

        try {
            OnboardingSource source = OnboardingSource.valueOf(value.trim().toUpperCase(Locale.ROOT));
            if (source == OnboardingSource.MANUAL) {
                return null;
            }
            return source;
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Onboarding source must be EXCEL, PDF, or all.");
        }
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

    private boolean isBlankRow(Row row, DataFormatter formatter) {
        int lastCell = Math.max(row.getLastCellNum(), 0);
        for (int index = 0; index < lastCell; index++) {
            if (StringUtils.hasText(readCell(row, index, formatter))) {
                return false;
            }
        }
        return true;
    }

    private String normalizeHeader(String value) {
        return value == null
                ? ""
                : value.trim()
                        .toLowerCase(Locale.ROOT)
                        .replaceAll("[^a-z0-9]+", " ")
                        .trim()
                        .replaceAll("\\s+", " ");
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

        String compact = trimmed.toLowerCase(Locale.ROOT).replaceAll("\\s+", "");
        if ("net".equals(compact) || ".net".equals(compact) || "dotnet".equals(compact)) {
            return ".NET";
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

    private String normalizeTechnologySearchTerm(String value) {
        if (!StringUtils.hasText(value)) {
            return "";
        }

        String trimmed = value.trim().toLowerCase(Locale.ROOT);
        String compact = trimmed.replaceAll("\\s+", "");
        if ("net".equals(compact) || ".net".equals(compact) || "dotnet".equals(compact)) {
            return "net";
        }

        return trimmed;
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

    private String normalizePhone(String phone) {
        if (phone == null) {
            return "";
        }

        String digits = phone.replaceAll("\\D", "");
        if (digits.length() == 11 && digits.startsWith("1")) {
            return digits.substring(1);
        }
        return digits;
    }

    private record ParsedImportRow(
            ConsultantRequest request,
            String errorMessage,
            String name,
            String email) {
    }

    private record ColumnMapping(
            int headerRowIndex,
            int nameColumn,
            int emailColumn,
            int phoneColumn,
            int technologyColumn,
            int experienceColumn,
            Integer statusColumn) {
    }

    private record PhoneTechnology(
            String phone,
            String technology) {
    }

    private record ExperienceBounds(
            Integer min,
            Integer max) {
    }
}
