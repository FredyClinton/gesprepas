package com.excelisprepas.backend.apprenant.domain.exception;

import java.util.UUID;

public class CentreIntrouvableException extends RuntimeException {
    public CentreIntrouvableException(UUID centreId) {
        super("Aucun centre trouvé avec l'id : " + centreId);
    }
}
