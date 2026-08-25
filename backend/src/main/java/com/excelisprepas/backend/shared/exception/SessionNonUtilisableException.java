package com.excelisprepas.backend.shared.exception;

import java.util.UUID;

public class SessionNonUtilisableException extends RuntimeException {
    public SessionNonUtilisableException(UUID sessionId) {
        super("La session " + sessionId + " est clôturée : aucun enregistrement n'est possible");
    }
}