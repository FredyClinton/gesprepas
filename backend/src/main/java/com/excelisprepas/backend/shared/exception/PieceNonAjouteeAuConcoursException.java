package com.excelisprepas.backend.shared.exception;

import java.util.UUID;

public class PieceNonAjouteeAuConcoursException extends RuntimeException {
    public PieceNonAjouteeAuConcoursException(UUID concoursId, UUID pieceRequiseId) {
        super("La pièce " + pieceRequiseId + " n'est pas rattachée au concours " + concoursId);
    }
}