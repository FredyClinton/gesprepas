package com.excelisprepas.backend.shared.exception;

import java.util.UUID;

public class RattachementDejaExistantException extends RuntimeException {
    public RattachementDejaExistantException(UUID utilisateurId, UUID sessionId) {
        super("L'utilisateur " + utilisateurId + " a déjà un rattachement pour la session " + sessionId);
    }
}