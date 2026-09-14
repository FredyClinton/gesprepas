package com.excelisprepas.backend.shared.exception;

import java.util.UUID;

public class AccesCentreInterditException extends RuntimeException {
    public AccesCentreInterditException(UUID centreId) {
        super("Vous n'êtes pas autorisé à agir sur le centre " + centreId);
    }
}