package com.excelisprepas.backend.shared.exception;

import java.util.UUID;

public class EnseignantIntrouvableException extends RuntimeException {
    public EnseignantIntrouvableException(UUID id) {
        super("Aucun enseignant trouvé avec l'id : " + id);
    }
}