package com.excelisprepas.backend.dossier.infrastructure.in.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record CreerConcoursRequest(
        @NotBlank(message = "Le nom est obligatoire") String nom,
        @NotNull(message = "La session est obligatoire") UUID sessionId,
        @NotNull(message = "La date limite de dépôt est obligatoire") LocalDate dateLimiteDepot,
        @NotNull(message = "La date limite de recevabilité au centre est obligatoire") LocalDate dateLimiteRecevabiliteCentre
) {
}