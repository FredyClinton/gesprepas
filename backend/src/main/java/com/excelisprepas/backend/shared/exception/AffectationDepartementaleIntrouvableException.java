package com.excelisprepas.backend.shared.exception;

import java.util.UUID;

public class AffectationDepartementaleIntrouvableException extends RuntimeException {
    public AffectationDepartementaleIntrouvableException(UUID enseignantId, UUID sessionId, UUID departementId) {
        super("L'enseignant " + enseignantId + " n'est pas dans le roster du département " + departementId
                + " pour la session " + sessionId);
    }
}