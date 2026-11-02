package com.excelisprepas.backend.financier.infrastructure.in.web.dto;

import com.excelisprepas.backend.financier.domain.model.StatutMouvement;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record EntreeResponse(
        UUID id, UUID sessionId, UUID motifId, BigDecimal montant, LocalDate date,
        UUID saisiParUtilisateurId, StatutMouvement statut, UUID centreId, UUID apprenantId, UUID formationId,
        UUID dossierConcoursId,
        String livreTitre
) {
    public EntreeResponse(UUID id, UUID sessionId, UUID motifId, BigDecimal montant, LocalDate date,
                          UUID saisiParUtilisateurId, StatutMouvement statut, UUID centreId, UUID apprenantId, UUID formationId,
                          UUID dossierConcoursId) {
        this(id, sessionId, motifId, montant, date, saisiParUtilisateurId, statut, centreId, apprenantId, formationId, dossierConcoursId, null);
    }
}