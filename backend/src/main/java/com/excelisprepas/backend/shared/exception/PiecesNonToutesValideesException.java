package com.excelisprepas.backend.shared.exception;

import java.util.UUID;

public class PiecesNonToutesValideesException extends RuntimeException {
    public PiecesNonToutesValideesException(UUID dossierId) {
        super("Toutes les pièces du dossier " + dossierId + " ne sont pas encore validées");
    }
}