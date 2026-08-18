package com.example.consultantmanagement.controller;

import com.example.consultantmanagement.dto.ConsultantRequest;
import com.example.consultantmanagement.dto.ConsultantResponse;
import com.example.consultantmanagement.dto.DashboardStatsResponse;
import com.example.consultantmanagement.dto.ImportSummaryResponse;
import com.example.consultantmanagement.service.ConsultantService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/consultants")
public class ConsultantController {

    private final ConsultantService consultantService;

    public ConsultantController(ConsultantService consultantService) {
        this.consultantService = consultantService;
    }

    @GetMapping
    public Page<ConsultantResponse> getConsultants(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String direction,
            @RequestParam(defaultValue = "") String status,
            @RequestParam(defaultValue = "") String technology,
            @RequestParam(defaultValue = "") String experienceRange) {
        return consultantService.findConsultants(search, page, size, sortBy, direction, status, technology, experienceRange);
    }

    @GetMapping("/stats")
    public DashboardStatsResponse getDashboardStats() {
        return consultantService.getDashboardStats();
    }

    @GetMapping("/onboarded")
    public Page<ConsultantResponse> getOnboardedConsultants(
            @RequestParam(defaultValue = "all") String source,
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "importedAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {
        return consultantService.findOnboardedConsultants(source, search, page, size, sortBy, direction);
    }

    @GetMapping("/{id}")
    public ConsultantResponse getConsultant(@PathVariable Long id) {
        return consultantService.getConsultant(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ConsultantResponse createConsultant(@Valid @RequestBody ConsultantRequest request) {
        return consultantService.createConsultant(request);
    }

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ImportSummaryResponse importConsultants(@RequestParam("file") MultipartFile file) {
        return consultantService.importConsultants(file);
    }

    @GetMapping(value = "/import-template", produces = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    public ResponseEntity<byte[]> downloadImportTemplate() {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=consultant-import-template.xlsx")
                .body(consultantService.buildImportTemplate());
    }

    @PutMapping("/{id}")
    public ConsultantResponse updateConsultant(
            @PathVariable Long id,
            @Valid @RequestBody ConsultantRequest request) {
        return consultantService.updateConsultant(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteConsultant(@PathVariable Long id) {
        consultantService.deleteConsultant(id);
    }
}
