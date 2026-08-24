package com.excelisprepas.backend.apprenant.infrastructure.in.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record RenegocierContratRequest(
        @NotNull(message = "Le montant est obligatoire")
        @DecimalMin(value = "0.0", inclusive = true, message = "Le montant ne peut pas être négatif")
        BigDecimal montantContrat,
        @NotNull(message = "La date de définition est obligatoire") LocalDate dateDefinitionContrat
) {
}