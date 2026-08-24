package com.excelisprepas.backend.shared.exception;

import java.util.UUID;

public class ApprenantIntrouvableException extends RuntimeException {
    public ApprenantIntrouvableException(UUID id) {
        super("Aucun apprenant trouvé avec l'id : " + id);
    }
}