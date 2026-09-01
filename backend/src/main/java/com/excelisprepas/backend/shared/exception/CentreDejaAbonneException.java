package com.excelisprepas.backend.shared.exception;

import java.util.UUID;

public class CentreDejaAbonneException extends RuntimeException {
    public CentreDejaAbonneException(UUID centreId, UUID formationId) {
        super("Le centre " + centreId + " est déjà abonné à la formation " + formationId);
    }
}
