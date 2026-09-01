package com.excelisprepas.backend.academie.affectation.infrastructure.in.web.dto;

import com.excelisprepas.backend.academie.affectation.domain.model.Jour;
import com.excelisprepas.backend.academie.affectation.domain.model.StatutAffectation;

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
        StatutAffectation statut
) {
}