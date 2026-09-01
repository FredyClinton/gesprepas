package com.excelisprepas.backend.shared.exception;

import java.util.UUID;

public class AbonnementIntrouvableException extends RuntimeException {
    public AbonnementIntrouvableException(UUID centreId, UUID formationId) {
        super("Abonnement introuvable pour le centre " + centreId + " et la formation " + formationId);
    }
}
