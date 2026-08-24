package com.excelisprepas.backend.personnel.infrastructure.in.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record ModifierCoutParSeanceRequest(
        @NotNull(message = "Le coût par séance est obligatoire")
        @DecimalMin(value = "0.0", inclusive = true, message = "Le coût par séance ne peut pas être négatif")
        BigDecimal coutParSeance
) {
}