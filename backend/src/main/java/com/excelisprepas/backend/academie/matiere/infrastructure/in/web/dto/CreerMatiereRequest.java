package com.excelisprepas.backend.academie.matiere.infrastructure.in.web.dto;

import jakarta.validation.constraints.NotBlank;

public record CreerMatiereRequest(
        @NotBlank(message = "Le nom est obligatoire") String nom,
        String couleur
) {
    public CreerMatiereRequest(String nom) {
        this(nom, null);
    }
}