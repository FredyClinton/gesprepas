package com.excelisprepas.backend.shared.exception;

import java.util.UUID;

public class EnseignantNonRattacheDepartementException extends RuntimeException {
    public EnseignantNonRattacheDepartementException(UUID enseignantId, UUID sessionId, UUID departementId) {
        super("L'enseignant " + enseignantId + " ne fait pas partie du roster du département " + departementId
                + " pour la session " + sessionId);
    }
}