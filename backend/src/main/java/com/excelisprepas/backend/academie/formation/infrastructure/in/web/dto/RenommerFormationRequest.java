package com.excelisprepas.backend.academie.formation.infrastructure.in.web.dto;

import jakarta.validation.constraints.NotBlank;

public record RenommerFormationRequest(
        @NotBlank(message = "Le nom est obligatoire") String nom
) {
}