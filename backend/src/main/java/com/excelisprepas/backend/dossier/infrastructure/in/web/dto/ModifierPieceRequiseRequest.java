package com.excelisprepas.backend.dossier.infrastructure.in.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record ModifierPieceRequiseRequest(
        @NotBlank(message = "Le nom est obligatoire") String nom,
        @NotNull(message = "Le montant est obligatoire")
        @DecimalMin(value = "0.0", message = "Le montant ne peut pas être négatif") BigDecimal montant
) {
}