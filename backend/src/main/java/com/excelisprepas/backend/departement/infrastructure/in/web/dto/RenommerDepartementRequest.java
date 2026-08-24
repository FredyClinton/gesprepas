package com.excelisprepas.backend.departement.infrastructure.in.web.dto;

import jakarta.validation.constraints.NotBlank;

public record RenommerDepartementRequest(
        @NotBlank(message = "Le nom est obligatoire") String nom
) {
}