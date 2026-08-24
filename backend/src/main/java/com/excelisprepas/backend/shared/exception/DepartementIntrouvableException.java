package com.excelisprepas.backend.shared.exception;

import java.util.UUID;

public class DepartementIntrouvableException extends RuntimeException {
    public DepartementIntrouvableException(UUID id) {
        super("Aucun département trouvé avec l'id : " + id);
    }
}