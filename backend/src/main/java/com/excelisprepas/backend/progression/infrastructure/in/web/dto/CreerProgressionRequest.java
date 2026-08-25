package com.excelisprepas.backend.progression.infrastructure.in.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.UUID;

public record CreerProgressionRequest(
        @NotNull(message = "La formation est obligatoire") UUID formationId,
        @NotNull(message = "La session est obligatoire") UUID sessionId,
        @NotNull(message = "La matière est obligatoire") UUID matiereId,
        @Positive(message = "La semaine doit être strictement positive") int semaine,
        @Positive(message = "Le numéro de cours doit être strictement positif") int numeroCours,
        @NotBlank(message = "Le thème est obligatoire") String theme,
        @NotBlank(message = "Le contenu est obligatoire") String contenu,
        String exercices
) {
}