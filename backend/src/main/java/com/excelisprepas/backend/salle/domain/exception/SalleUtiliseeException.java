package com.excelisprepas.backend.salle.domain.exception;

import java.util.UUID;

public class SalleUtiliseeException extends IllegalStateException {
    public SalleUtiliseeException(UUID salleId) {
        super("Impossible de supprimer la salle " + salleId + " : elle est encore référencée par des affectations");
    }
}