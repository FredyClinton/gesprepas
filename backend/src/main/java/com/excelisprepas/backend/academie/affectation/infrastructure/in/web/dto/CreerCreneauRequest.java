package com.excelisprepas.backend.academie.affectation.infrastructure.in.web.dto;

import com.excelisprepas.backend.academie.affectation.domain.model.Jour;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.UUID;

public record CreerCreneauRequest(
        @NotNull(message = "Le centre est obligatoire") UUID centreId,
        @NotNull(message = "La session est obligatoire") UUID sessionId,
        @NotNull(message = "La formation est obligatoire") UUID formationId,
        @NotNull(message = "La salle est obligatoire") UUID salleId,
        @NotNull(message = "La matière est obligatoire") UUID matiereId,
        @NotNull(message = "Le jour est obligatoire") Jour jour,
        @Positive(message = "La séance doit être strictement positive") int seance,
        @Positive(message = "La semaine doit être strictement positive") int semaine
) {
}