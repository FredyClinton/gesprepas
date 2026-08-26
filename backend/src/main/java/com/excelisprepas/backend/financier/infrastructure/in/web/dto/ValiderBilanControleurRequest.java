package com.excelisprepas.backend.financier.infrastructure.in.web.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ValiderBilanControleurRequest(
        @NotNull(message = "Le validateur est obligatoire") UUID validateurUtilisateurId
) {
}