package com.excelisprepas.backend.shared.exception;

import java.util.UUID;

public class AffectationIntrouvableException extends RuntimeException {
    public AffectationIntrouvableException(UUID id) {
        super("Aucune affectation trouvée avec l'id : " + id);
    }
}