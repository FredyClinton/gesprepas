package com.excelisprepas.backend.salle.infrastructure.in.web.dto;

import java.util.UUID;

public record SalleResponse(
        UUID id,
        String nom,
        UUID centreId,
        UUID formationId
) {
}