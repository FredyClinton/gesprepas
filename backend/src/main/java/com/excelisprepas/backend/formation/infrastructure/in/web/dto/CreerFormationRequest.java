package com.excelisprepas.backend.formation.infrastructure.in.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreerFormationRequest(
        @NotBlank(message = "Le nom est obligatoire") String nom,
        @NotNull(message = "Le centre est obligatoire") UUID centreId,
        @NotNull(message = "La session est obligatoire") UUID sessionId
) {
}
