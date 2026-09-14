package com.excelisprepas.backend.academie.quota.infrastructure.in.web.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.UUID;

public record DefinirQuotaRequest(
        @NotNull(message = "La formation est obligatoire") UUID formationId,
        @NotNull(message = "La session est obligatoire") UUID sessionId,
        @NotNull(message = "La matière est obligatoire") UUID matiereId,
        @Positive(message = "La semaine doit être strictement positive") int semaine,
        @Min(value = 0, message = "Le quota ne peut pas être négatif") int quota
) {
}
