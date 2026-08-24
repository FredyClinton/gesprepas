package com.excelisprepas.backend.shared.exception;

import java.util.UUID;

public class ProgressionIntrouvableException extends RuntimeException {
    public ProgressionIntrouvableException(UUID id) {
        super("Aucune progression trouvée avec l'id : " + id);
    }
}