package com.excelisprepas.backend.affectation.infrastructure.in.web.dto;

import com.excelisprepas.backend.affectation.domain.model.StatutAffectation;

import java.util.UUID;

public record AffectationResponse(
        UUID id,
        UUID centreId,
        UUID sessionId,
        UUID formationId,
        UUID salleId,
        UUID matiereId,
        UUID enseignantId,
        int seance,
        int semaine,
        StatutAffectation statut
) {
}