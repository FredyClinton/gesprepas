package com.excelisprepas.backend.shared.exception;

import java.util.UUID;

public class MatiereNonRattacheeDepartementException extends RuntimeException {
    public MatiereNonRattacheeDepartementException(UUID matiereId) {
        super("Aucun département n'est rattaché à la matière " + matiereId);
    }
}