package com.excelisprepas.backend.dossier.infrastructure.in.web.dto;

import com.excelisprepas.backend.dossier.domain.model.StatutDossier;

import java.time.LocalDate;
import java.util.UUID;

public record DossierResponse(
        UUID id, UUID apprenantId, UUID centreId, UUID sessionId, StatutDossier statut,
        LocalDate dateOuverture, LocalDate dateCloture, String observation
) {
}