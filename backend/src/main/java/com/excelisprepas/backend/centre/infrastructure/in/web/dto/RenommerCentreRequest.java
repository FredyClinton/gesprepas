package com.excelisprepas.backend.centre.infrastructure.in.web.dto;

import jakarta.validation.constraints.NotBlank;

public record RenommerCentreRequest(
        @NotBlank(message = "Le nom est obligatoire") String nom
) {
}