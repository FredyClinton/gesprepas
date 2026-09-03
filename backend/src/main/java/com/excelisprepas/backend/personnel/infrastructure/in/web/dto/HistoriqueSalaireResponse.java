package com.excelisprepas.backend.personnel.infrastructure.in.web.dto;

import com.excelisprepas.backend.personnel.domain.model.HistoriqueSalairePersonnel;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record HistoriqueSalaireResponse(
        UUID id,
        UUID personnelId,
        UUID sessionId,
        BigDecimal salaireReference,
        LocalDate dateDebutEffet,
        LocalDateTime dateModification
) {
    public static HistoriqueSalaireResponse fromDomain(HistoriqueSalairePersonnel historique) {
        return new HistoriqueSalaireResponse(
                historique.getId(),
                historique.getPersonnelId(),
                historique.getSessionId(),
                historique.getSalaireReference(),
                historique.getDateDebutEffet(),
                historique.getDateModification()
        );
    }
}
