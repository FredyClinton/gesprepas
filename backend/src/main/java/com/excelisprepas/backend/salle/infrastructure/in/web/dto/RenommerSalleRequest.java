package com.excelisprepas.backend.salle.infrastructure.in.web.dto;

import jakarta.validation.constraints.NotBlank;

public record RenommerSalleRequest(
        @NotBlank(message = "Le nom est obligatoire") String nom
) {
}