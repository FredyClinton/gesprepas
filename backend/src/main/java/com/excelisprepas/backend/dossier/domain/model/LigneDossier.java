package com.excelisprepas.backend.dossier.domain.model;

import java.time.LocalDate;
import java.util.UUID;

/** Ligne de la liste des dossiers : le dossier, l'apprenant associé et l'échéance de dépôt la plus proche. */
public record LigneDossier(
        UUID id, UUID apprenantId, UUID centreId, UUID sessionId, StatutDossier statut,
        LocalDate dateOuverture, LocalDate dateCloture, String observation,
        String apprenantNom, String apprenantPrenom, String apprenantReferenceRecu, UUID apprenantFormationId,
        LocalDate dateLimiteDepot
) {
}
