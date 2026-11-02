package com.excelisprepas.backend.financier.infrastructure.in.web.dto;

import com.excelisprepas.backend.financier.domain.model.StatutMouvement;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ValiderMouvementRequest(
        @NotNull(message = "La décision est obligatoire") StatutMouvement decision,
        UUID validateurUtilisateurId
) {
}