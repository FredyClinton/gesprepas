package com.excelisprepas.backend.shared.exception;

import java.util.UUID;

public class PieceDossierIntrouvableException extends RuntimeException {
    public PieceDossierIntrouvableException(UUID id) {
        super("Aucune PieceDossier trouvée avec l'id : " + id);
    }
}