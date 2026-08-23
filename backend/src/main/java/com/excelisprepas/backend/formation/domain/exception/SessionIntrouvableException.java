package com.excelisprepas.backend.formation.domain.exception;

import java.util.UUID;

public class SessionIntrouvableException extends RuntimeException {
    public SessionIntrouvableException(UUID sessionId) {
        super("Aucune session trouvée avec l'id : " + sessionId);
    }
}
