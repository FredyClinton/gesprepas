package com.excelisprepas.backend.dossier.infrastructure.in.web.dto;

import com.excelisprepas.backend.dossier.domain.model.LigneDossier;
import com.excelisprepas.backend.dossier.domain.model.StatutDossier;

import java.time.LocalDate;
import java.util.UUID;

/** {@link DossierResponse} plus l'apprenant associé et l'échéance de dépôt la plus proche. */
public record LigneDossierResponse(
        UUID id, UUID apprenantId, UUID centreId, UUID sessionId, StatutDossier statut,
        LocalDate dateOuverture, LocalDate dateCloture, String observation,
        String apprenantNom, String apprenantPrenom, String apprenantReferenceRecu, UUID apprenantFormationId,
        LocalDate dateLimiteDepot
) {
    public static LigneDossierResponse de(LigneDossier l) {
        return new LigneDossierResponse(l.id(), l.apprenantId(), l.centreId(), l.sessionId(), l.statut(),
                l.dateOuverture(), l.dateCloture(), l.observation(), l.apprenantNom(), l.apprenantPrenom(),
                l.apprenantReferenceRecu(), l.apprenantFormationId(), l.dateLimiteDepot());
    }
}
