package com.excelisprepas.backend.session.domain.exception;

import java.util.UUID;

/**
 * Levée quand on tente de supprimer une SessionAcademique encore référencée
 * par des Formations. Étend IllegalStateException pour réutiliser le mapping 409.
 */
public class SessionUtiliseeException extends IllegalStateException {
    public SessionUtiliseeException(UUID sessionId) {
        super("Impossible de supprimer la session " + sessionId
                + " : elle est encore référencée par des formations");
    }
}