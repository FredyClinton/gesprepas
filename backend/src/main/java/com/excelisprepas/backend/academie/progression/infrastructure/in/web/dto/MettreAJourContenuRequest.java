package com.excelisprepas.backend.academie.progression.infrastructure.in.web.dto;

import jakarta.validation.constraints.NotBlank;

public record MettreAJourContenuRequest(
        @NotBlank(message = "Le thème est obligatoire") String theme,
        @NotBlank(message = "Le contenu est obligatoire") String contenu,
        String exercices
) {
}