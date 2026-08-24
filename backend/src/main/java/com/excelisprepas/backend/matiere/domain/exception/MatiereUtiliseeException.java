package com.excelisprepas.backend.matiere.domain.exception;

import java.util.UUID;

public class MatiereUtiliseeException extends IllegalStateException {
    public MatiereUtiliseeException(UUID matiereId) {
        super("Impossible de supprimer la matière " + matiereId
                + " : elle est encore référencée par un département, une affectation ou une progression");
    }
}