package com.excelisprepas.backend.shared.exception;

import java.util.UUID;

public class SalleIntrouvableException extends RuntimeException {
    public SalleIntrouvableException(UUID salleId) {
        super("Aucune salle trouvée avec l'id : " + salleId);
    }
}