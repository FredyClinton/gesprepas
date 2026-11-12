package com.excelisprepas.backend.financier.infrastructure.in.web.dto;

import com.excelisprepas.backend.financier.domain.model.LigneMouvement;
import com.excelisprepas.backend.financier.domain.model.StatutMouvement;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/** {@link MouvementFinancierResponse} plus le tiers résolu et le solde progressif de la session. */
public record LigneMouvementResponse(
        UUID id, String type, UUID sessionId, UUID motifId, BigDecimal montant, LocalDate date,
        UUID saisiParUtilisateurId, StatutMouvement statut, UUID centreId, UUID apprenantId, UUID formationId,
        String ordonnateur, String details, String tiers, BigDecimal soldeProgressif
) {
    public static LigneMouvementResponse de(LigneMouvement l) {
        return new LigneMouvementResponse(l.id(), l.type(), l.sessionId(), l.motifId(), l.montant(), l.date(),
                l.saisiParUtilisateurId(), l.statut(), l.centreId(), l.apprenantId(), l.formationId(),
                l.ordonnateur(), l.details(), l.tiers(), l.soldeProgressif());
    }
}
