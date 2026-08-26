package com.excelisprepas.backend.financier.infrastructure.in.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record SaisirEntreeRequest(
        @NotNull(message = "La session est obligatoire") UUID sessionId,
        @NotNull(message = "Le motif est obligatoire") UUID motifId,
        @NotNull(message = "Le montant est obligatoire")
        @DecimalMin(value = "0.01", message = "Le montant doit être strictement positif") BigDecimal montant,
        @NotNull(message = "La date est obligatoire") LocalDate date,
        @NotNull(message = "L'utilisateur qui encaisse est obligatoire") UUID saisiParUtilisateurId,
        @NotNull(message = "Le centre est obligatoire") UUID centreId,
        UUID apprenantId
) {
}