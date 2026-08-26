package com.excelisprepas.backend.dossier.infrastructure.in.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record DossierConcoursResponse(
        UUID id, UUID dossierId, UUID concoursId, UUID centreId, UUID sessionId,
        LocalDate dateAjout, BigDecimal montantTotal
) {
}