package com.excelisprepas.backend.shared.exception;

import java.util.UUID;

public class RattachementRequisException extends RuntimeException {
    public RattachementRequisException(UUID utilisateurId, UUID sessionId) {
        super("L'utilisateur " + utilisateurId + " doit d'abord être rattaché à un centre pour la session "
                + sessionId + " avant de recevoir un rôle centre-scopé");
    }
}