package com.excelisprepas.backend.financier.infrastructure.in.web.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record ValiderBilanChefCentreRequest(
        @NotNull(message = "Le centre est obligatoire") UUID centreId,
        @NotNull(message = "La session est obligatoire") UUID sessionId,
        @NotNull(message = "La date est obligatoire") LocalDate date,
        @NotNull(message = "Le validateur est obligatoire") UUID validateurUtilisateurId
) {
}