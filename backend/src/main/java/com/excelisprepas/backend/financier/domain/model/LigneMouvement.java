package com.excelisprepas.backend.financier.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Ligne de la liste des mouvements. {@code soldeProgressif} est le solde cumulé (entrées - sorties non rejetées) de
 * toute la session, dans l'ordre chronologique, jusqu'à cette écriture incluse - indépendant des filtres appliqués.
 */
public record LigneMouvement(
        UUID id,
        String type,
        UUID sessionId,
        UUID motifId,
        BigDecimal montant,
        LocalDate date,
        UUID saisiParUtilisateurId,
        StatutMouvement statut,
        UUID centreId,
        UUID apprenantId,
        UUID formationId,
        String ordonnateur,
        String details,
        String tiers,
        BigDecimal soldeProgressif
) {
}
