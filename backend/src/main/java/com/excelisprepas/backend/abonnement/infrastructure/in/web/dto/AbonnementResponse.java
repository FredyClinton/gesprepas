package com.excelisprepas.backend.abonnement.infrastructure.in.web.dto;

import java.time.LocalDate;
import java.util.UUID;

public record AbonnementResponse(
        UUID id,
        UUID centreId,
        UUID formationId,
        UUID sessionId,
        LocalDate dateAbonnement
) {
}
