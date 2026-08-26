package com.excelisprepas.backend.shared.exception;

import java.util.UUID;

public class ConcoursIntrouvableException extends RuntimeException {
    public ConcoursIntrouvableException(UUID id) {
        super("Aucun concours trouvé avec l'id : " + id);
    }
}