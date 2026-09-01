package com.excelisprepas.backend.shared.exception;

import java.util.UUID;

public class PhaseIntrouvableException extends RuntimeException {
    public PhaseIntrouvableException(UUID id) {
        super("Aucune phase trouvée avec l'id : " + id);
    }
}

