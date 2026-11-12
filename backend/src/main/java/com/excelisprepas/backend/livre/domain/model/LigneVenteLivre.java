package com.excelisprepas.backend.livre.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/** Ligne de la liste des ventes, avec le nom du centre et le titre du livre déjà résolus. */
public record LigneVenteLivre(
        UUID id, UUID sessionId, UUID centreId, String centreNom, LocalDate dateVente, String nomAcheteur,
        UUID apprenantId, boolean estExterne, UUID livreId, String livreTitre, int quantite,
        BigDecimal prixUnitaire, BigDecimal montantTotal, UUID entreeId, UUID saisiParUtilisateurId,
        LocalDateTime createdAt
) {
}
