package com.excelisprepas.backend.shared.exception;

import java.util.UUID;

public class FormationIntrouvableException extends RuntimeException {
    public FormationIntrouvableException(UUID formationId) {
        super("Aucune formation trouvée avec l'id : " + formationId);
    }
}
