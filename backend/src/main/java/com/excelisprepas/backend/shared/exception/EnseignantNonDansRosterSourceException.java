package com.excelisprepas.backend.shared.exception;

import java.util.UUID;

public class EnseignantNonDansRosterSourceException extends RuntimeException {
    public EnseignantNonDansRosterSourceException(UUID enseignantId, UUID sessionSourceId, UUID departementId) {
        super("L'enseignant " + enseignantId + " ne fait pas partie du roster du département " + departementId
                + " pour la session source " + sessionSourceId + " — impossible de le copier");
    }
}