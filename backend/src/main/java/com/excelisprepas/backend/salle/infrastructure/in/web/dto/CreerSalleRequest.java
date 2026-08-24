package com.excelisprepas.backend.salle.infrastructure.in.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreerSalleRequest(
        @NotBlank(message = "Le nom est obligatoire") String nom,
        @NotNull(message = "Le centre est obligatoire") UUID centreId,
        @NotNull(message = "La formation est obligatoire") UUID formationId
) {
}