package com.excelisprepas.backend.academie.quota.infrastructure.in.web.dto;

import java.util.UUID;

public record QuotaHebdomadaireResponse(
        UUID id,
        UUID formationId,
        UUID sessionId,
        UUID matiereId,
        int semaine,
        int quota
) {
}
