package com.excelisprepas.backend.personnel.infrastructure.in.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record CreerEnseignantRequest(
        @NotBlank(message = "Le nom est obligatoire") String nom,
        @NotBlank(message = "Le prénom est obligatoire") String prenom,
        @NotBlank(message = "Le matricule est obligatoire") String matricule,
        @NotNull(message = "Le coût par séance est obligatoire")
        @DecimalMin(value = "0.0", message = "Le coût par séance ne peut pas être négatif")
        BigDecimal coutParSeance
) {
}
