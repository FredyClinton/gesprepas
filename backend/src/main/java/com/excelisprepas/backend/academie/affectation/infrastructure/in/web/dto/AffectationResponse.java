package com.excelisprepas.backend.academie.affectation.infrastructure.in.web.dto;

import com.excelisprepas.backend.academie.affectation.domain.model.Jour;
import com.excelisprepas.backend.academie.affectation.domain.model.StatutAffectation;
import com.excelisprepas.backend.academie.affectation.domain.model.StatutPaiement;

import java.math.BigDecimal;
import java.util.UUID;

public record AffectationResponse(
        UUID id,
        UUID centreId,
        UUID sessionId,
        UUID formationId,
        UUID salleId,
        UUID matiereId,
        UUID enseignantId,
        Jour jour,
        int seance,
        int semaine,
        StatutAffectation statut,
        StatutPaiement statutPaiement,
        BigDecimal coutApplique,
        UUID fichePaieId
) {
    public AffectationResponse(
            UUID id, UUID centreId, UUID sessionId, UUID formationId,
            UUID salleId, UUID matiereId, UUID enseignantId,
            Jour jour, int seance, int semaine, StatutAffectation statut) {
        this(id, centreId, sessionId, formationId, salleId, matiereId, enseignantId,
                jour, seance, semaine, statut, StatutPaiement.NON_PAYEE, null, null);
    }
}