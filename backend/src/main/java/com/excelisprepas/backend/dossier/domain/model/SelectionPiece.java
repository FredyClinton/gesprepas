package com.excelisprepas.backend.dossier.domain.model;

import java.util.Objects;
import java.util.UUID;

public record SelectionPiece(UUID pieceRequiseId, int quantite) {
    public SelectionPiece {
        Objects.requireNonNull(pieceRequiseId, "pieceRequiseId ne peut pas être nul");
        if (quantite <= 0) {
            throw new IllegalArgumentException("quantite doit être strictement positive");
        }
    }
}