package com.excelisprepas.backend.financier.infrastructure.in.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record ModifierEntreeRequest(
        @NotNull(message = "Le montant est obligatoire")
        @DecimalMin(value = "0.01", message = "Le montant doit être strictement positif")
        BigDecimal montant,

        @NotNull(message = "La date est obligatoire")
        LocalDate date,

        @NotNull(message = "Le motif est obligatoire")
        UUID motifId,

        UUID apprenantId
) {
}

