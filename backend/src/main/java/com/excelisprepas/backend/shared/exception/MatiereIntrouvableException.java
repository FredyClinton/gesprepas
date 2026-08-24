package com.excelisprepas.backend.shared.exception;

import java.util.UUID;

public class MatiereIntrouvableException extends RuntimeException {
    public MatiereIntrouvableException(UUID matiereId) {
        super("Aucune matière trouvée avec l'id : " + matiereId);
    }
}
