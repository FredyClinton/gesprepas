package com.excelisprepas.backend.shared.exception;

import java.util.UUID;

public class EnseignantDejaDansRosterException extends RuntimeException {
    public EnseignantDejaDansRosterException(UUID enseignantId, UUID sessionId, UUID departementId) {
        super("L'enseignant " + enseignantId + " est déjà dans le roster du département " + departementId
                + " pour la session " + sessionId);
    }
}