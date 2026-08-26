package com.excelisprepas.backend.shared.exception;

import java.util.UUID;

public class ParametrePaieIntrouvableException extends RuntimeException {
    public ParametrePaieIntrouvableException(UUID sessionId) {
        super("Aucun paramètre de paie (tarif standard) défini pour la session " + sessionId);
    }
}