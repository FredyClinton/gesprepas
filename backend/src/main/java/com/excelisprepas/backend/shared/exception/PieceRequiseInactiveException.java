package com.excelisprepas.backend.shared.exception;

import java.util.UUID;

public class PieceRequiseInactiveException extends RuntimeException {
    public PieceRequiseInactiveException(UUID id) {
        super("La pièce requise " + id + " est désactivée et ne peut plus être ajoutée à un concours");
    }
}