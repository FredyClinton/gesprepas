package com.excelisprepas.backend.progression.infrastructure.in.web.dto;

import java.util.UUID;

public record ProgressionResponse(
        UUID id,
        UUID formationId,
        UUID matiereId,
        int semaine,
        int numeroCours,
        String theme,
        String contenu,
        String exercices
) {
}