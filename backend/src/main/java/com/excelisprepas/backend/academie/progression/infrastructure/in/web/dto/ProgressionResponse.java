package com.excelisprepas.backend.academie.progression.infrastructure.in.web.dto;

import java.util.UUID;

public record ProgressionResponse(
        UUID id,
        UUID formationId,
        UUID sessionId,
        UUID phaseId,
        UUID matiereId,
        int semaine,
        int numeroCours,
        String theme,
        String contenu,
        String exercices
) {
}