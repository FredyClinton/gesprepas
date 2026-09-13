package com.excelisprepas.backend.livre.infrastructure.in.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Schema(description = "Représentation d'un livre / support pédagogique")
public record LivreResponse(
        @Schema(description = "Identifiant unique du livre", example = "b1000000-0000-0000-0000-000000000001")
        UUID id,

        @Schema(description = "Titre du livre", example = "AXIOME")
        String titre,

        @Schema(description = "Description du livre", example = "Manuel de référence pour la préparation aux concours scientifiques")
        String description,

        @Schema(description = "Prix unitaire en FCFA", example = "10000.00")
        BigDecimal prix,

        @Schema(description = "Indique si le livre est disponible à la vente", example = "true")
        boolean actif,

        @Schema(description = "Date de création")
        LocalDateTime createdAt
) {
}

