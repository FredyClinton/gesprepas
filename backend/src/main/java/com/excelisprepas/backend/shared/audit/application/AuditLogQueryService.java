package com.excelisprepas.backend.shared.audit.application;

import com.excelisprepas.backend.shared.audit.infrastructure.in.web.dto.AuditLogResponseDto;
import com.excelisprepas.backend.shared.audit.infrastructure.out.persistence.AuditLogRepository;
import com.excelisprepas.backend.shared.audit.infrastructure.out.persistence.AuditLogSpecification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class AuditLogQueryService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogQueryService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public Page<AuditLogResponseDto> rechercher(
            String module,
            UUID centreId,
            UUID utilisateurId,
            Instant dateDebut,
            Instant dateFin,
            String recherche,
            int page,
            int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        var spec = AuditLogSpecification.avecFiltres(module, centreId, utilisateurId, dateDebut, dateFin, recherche);
        return auditLogRepository.findAll(spec, pageable).map(AuditLogResponseDto::fromEntity);
    }
}
