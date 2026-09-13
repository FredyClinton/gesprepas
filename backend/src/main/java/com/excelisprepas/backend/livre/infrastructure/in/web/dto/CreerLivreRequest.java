package com.excelisprepas.backend.livre.infrastructure.in.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

@Schema(description = "Requête de création d'un nouveau livre")
public record CreerLivreRequest(
        @NotBlank(message = "Le titre du livre est obligatoire")
        @Schema(description = "Titre du livre", example = "AXIOME")
        String titre,

        @Schema(description = "Description ou matière concernée", example = "Manuel de référence physique et maths")
        String description,

        @NotNull(message = "Le prix est obligatoire")
        @DecimalMin(value = "0.0", inclusive = true, message = "Le prix ne peut pas être négatif")
        @Schema(description = "Prix de vente unitaire", example = "10000.00")
        BigDecimal prix
) {
}

