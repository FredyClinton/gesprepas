package com.excelisprepas.backend.shared.exception;

import java.util.UUID;

public class ConcoursDateLimiteDepasseeException extends RuntimeException {
    public ConcoursDateLimiteDepasseeException(UUID concoursId) {
        super("La date limite (dépôt ou recevabilité au centre) du concours " + concoursId + " est dépassée");
    }
}