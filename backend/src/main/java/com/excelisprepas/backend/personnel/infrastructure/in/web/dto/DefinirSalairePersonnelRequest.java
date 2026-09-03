package com.excelisprepas.backend.personnel.infrastructure.in.web.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DefinirSalairePersonnelRequest(
        @NotNull(message = "Le salaire ne peut pas être nul")
        @PositiveOrZero(message = "Le salaire ne peut pas être négatif")
        BigDecimal salaireReference,
        LocalDate dateDebutEffet
) {
}
