package com.excelisprepas.backend.apprenant.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/** Ligne de la liste des apprenants : l'apprenant, sa situation de paiement et son dossier de concours éventuel. */
public record LigneApprenant(
        UUID id, String nom, String prenom, LocalDate dateNaissance, LocalDate dateInscription,
        UUID centreId, UUID sessionId, String contactApprenant, String nomParent, String contactParent,
        String etablissementOrigine, UUID formationId, BigDecimal montantContrat, boolean preInscrit,
        String referenceRecu,
        BigDecimal montantPaye,
        BigDecimal soldeRestant,
        UUID dossierId,
        String statutDossier
) {
}
