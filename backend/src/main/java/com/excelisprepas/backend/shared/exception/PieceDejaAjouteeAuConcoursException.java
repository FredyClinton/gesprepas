package com.excelisprepas.backend.shared.exception;

import java.util.UUID;

public class PieceDejaAjouteeAuConcoursException extends RuntimeException {
    public PieceDejaAjouteeAuConcoursException(UUID concoursId, UUID pieceRequiseId) {
        super("La pièce " + pieceRequiseId + " est déjà rattachée au concours " + concoursId);
    }
}