package com.excelisprepas.backend.apprenant.infrastructure.in.web.dto;

import com.excelisprepas.backend.apprenant.domain.model.LigneApprenant;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/** {@link ApprenantResponse} enrichi de la situation de paiement et du dossier, pour la liste paginée. */
public record LigneApprenantResponse(
        UUID id, String nom, String prenom, LocalDate dateNaissance,
        LocalDate dateInscription, UUID centreId, UUID sessionId,
        String contactApprenant, String nomParent, String contactParent,
        String etablissementOrigine, UUID formationId, BigDecimal montantContrat,
        Boolean preInscrit, String referenceRecu,
        BigDecimal montantPaye, BigDecimal soldeRestant, UUID dossierId, String statutDossier
) {
    public static LigneApprenantResponse de(LigneApprenant l) {
        return new LigneApprenantResponse(l.id(), l.nom(), l.prenom(), l.dateNaissance(), l.dateInscription(),
                l.centreId(), l.sessionId(), l.contactApprenant(), l.nomParent(), l.contactParent(),
                l.etablissementOrigine(), l.formationId(), l.montantContrat(), l.preInscrit(), l.referenceRecu(),
                l.montantPaye(), l.soldeRestant(), l.dossierId(), l.statutDossier());
    }
}
