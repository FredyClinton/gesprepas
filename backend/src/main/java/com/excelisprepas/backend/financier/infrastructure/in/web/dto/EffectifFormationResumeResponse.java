package com.excelisprepas.backend.financier.infrastructure.in.web.dto;

import java.util.UUID;

public record EffectifFormationResumeResponse(
        UUID formationId,
        String formationNom,
        long nouveauxElevesJour,
        long effectifTotal
) {
}
