package com.excelisprepas.backend.centre.infrastructure.in.web.dto;

import jakarta.validation.constraints.NotBlank;

public record RelocaliserCentreRequest(
        @NotBlank(message = "L'adresse est obligatoire") String adresse,
        @NotBlank(message = "La ville est obligatoire") String ville
) {
}