package com.excelisprepas.backend.academie.salle.infrastructure.in.web.dto;

import java.util.UUID;

public record SalleResponse(
        UUID id,
        String nom,
        UUID centreId,
        UUID sessionId,
        UUID formationId,
        UUID phaseId
) {
}