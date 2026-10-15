package com.excelisprepas.backend.financier.domain.model;

import java.util.UUID;

public record EffectifFormationResume(
        UUID formationId,
        String formationNom,
        long nouveauxElevesJour,
        long effectifTotal
) {
}
