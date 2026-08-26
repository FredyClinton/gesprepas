package com.excelisprepas.backend.dossier.infrastructure.in.web.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.UUID;

public record AjouterPieceRequest(
        @NotNull(message = "La pièce est obligatoire") UUID pieceRequiseId,
        @Positive(message = "La quantité doit être strictement positive") int quantite
) {
}