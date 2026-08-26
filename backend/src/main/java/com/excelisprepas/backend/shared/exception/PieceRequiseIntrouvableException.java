package com.excelisprepas.backend.shared.exception;

import java.util.UUID;

public class PieceRequiseIntrouvableException extends RuntimeException {
    public PieceRequiseIntrouvableException(UUID id) {
        super("Aucune pièce requise trouvée avec l'id : " + id);
    }
}