package com.excelisprepas.backend.shared.exception;

import java.util.UUID;

public class MotifIntrouvableException extends RuntimeException {
    public MotifIntrouvableException(UUID id) {
        super("Aucun motif trouvé avec l'id : " + id);
    }
}