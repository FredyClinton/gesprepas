package com.excelisprepas.backend.dossier.infrastructure.in.web.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AjouterPieceAuConcoursRequest(
        @NotNull(message = "La pièce requise est obligatoire") UUID pieceRequiseId
) {
}