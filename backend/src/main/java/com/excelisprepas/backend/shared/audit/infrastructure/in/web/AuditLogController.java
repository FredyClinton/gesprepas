package com.excelisprepas.backend.shared.audit.infrastructure.in.web;

import com.excelisprepas.backend.shared.audit.application.AuditLogQueryService;
import com.excelisprepas.backend.shared.audit.infrastructure.in.web.dto.AuditLogResponseDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/api/audit-logs")
@Tag(name = "Audit", description = "Consultation et supervision des journaux d'audit")
public class AuditLogController {

    private final AuditLogQueryService auditLogQueryService;

    public AuditLogController(AuditLogQueryService auditLogQueryService) {
        this.auditLogQueryService = auditLogQueryService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('DIRECTEUR', 'DIRECTEUR_ACADEMIQUE', 'CHEF_CENTRE')")
    @Operation(summary = "Rechercher et filtrer les journaux d'audit")
    public Page<AuditLogResponseDto> rechercher(
            @RequestParam(required = false) String module,
            @RequestParam(required = false) UUID centreId,
            @RequestParam(required = false) UUID utilisateurId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant dateDebut,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant dateFin,
            @RequestParam(required = false) String recherche,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return auditLogQueryService.rechercher(
                module, centreId, utilisateurId, dateDebut, dateFin, recherche, page, size
        );
    }
}
