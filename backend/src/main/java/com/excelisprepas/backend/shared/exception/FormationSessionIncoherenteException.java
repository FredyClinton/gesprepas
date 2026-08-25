package com.excelisprepas.backend.shared.exception;

import java.util.UUID;

public class FormationSessionIncoherenteException extends RuntimeException {
    public FormationSessionIncoherenteException(UUID formationId, UUID sessionId) {
        super("La formation " + formationId + " n'appartient pas à la session " + sessionId);
    }
}