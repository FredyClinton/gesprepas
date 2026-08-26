package com.excelisprepas.backend.financier.infrastructure.in.web.dto;

import com.excelisprepas.backend.financier.domain.model.StatutMouvement;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record EntreeResponse(
        UUID id, UUID sessionId, UUID motifId, BigDecimal montant, LocalDate date,
        UUID saisiParUtilisateurId, StatutMouvement statut, UUID centreId, UUID apprenantId, UUID formationId
) {
}