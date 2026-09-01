package com.excelisprepas.backend.academie.departement.infrastructure.in.web.dto;

import jakarta.validation.constraints.NotBlank;

public record RenommerDepartementRequest(
        @NotBlank(message = "Le nom est obligatoire") String nom
) {
}