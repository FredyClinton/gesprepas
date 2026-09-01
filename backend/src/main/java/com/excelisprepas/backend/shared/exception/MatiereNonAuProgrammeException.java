package com.excelisprepas.backend.shared.exception;

import java.util.UUID;

public class MatiereNonAuProgrammeException extends RuntimeException {
    public MatiereNonAuProgrammeException(UUID formationId, UUID matiereId) {
        super("La matière " + matiereId + " ne fait pas partie du programme de la formation " + formationId);
    }
}
