package com.excelisprepas.backend.shared.exception;

import java.util.UUID;

public class CentreNonAbonneFormationException extends RuntimeException {
    public CentreNonAbonneFormationException(UUID centreId, UUID formationId, UUID sessionId) {
        super("Le centre " + centreId + " n'est pas abonné à la formation " + formationId + " pour la session " + sessionId);
    }
}
