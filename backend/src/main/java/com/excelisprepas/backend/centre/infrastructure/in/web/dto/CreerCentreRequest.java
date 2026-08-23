package com.excelisprepas.backend.centre.infrastructure.in.web.dto;


import jakarta.validation.constraints.NotBlank;

public record CreerCentreRequest(
        @NotBlank(message = "Le nom est obligatoire") String nom,
        @NotBlank(message = "L'adresse est obligatoire") String adresseInitiale,
        @NotBlank(message = "La ville est obligatoire") String villeInitiale
) {
}