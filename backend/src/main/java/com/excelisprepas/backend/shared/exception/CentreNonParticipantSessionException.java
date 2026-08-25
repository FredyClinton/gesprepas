package com.excelisprepas.backend.shared.exception;

import java.util.UUID;

public class CentreNonParticipantSessionException extends RuntimeException {
    public CentreNonParticipantSessionException(UUID centreId, UUID sessionId) {
        super("Le centre " + centreId + " n'a pas rejoint la session " + sessionId);
    }
}