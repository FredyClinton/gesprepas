package com.excelisprepas.backend.shared.exception;

import java.util.UUID;

public class FormationIntrouvableException extends RuntimeException {
    public FormationIntrouvableException(UUID formationId) {
        super("La formation demandée est introuvable.");
    }
}
