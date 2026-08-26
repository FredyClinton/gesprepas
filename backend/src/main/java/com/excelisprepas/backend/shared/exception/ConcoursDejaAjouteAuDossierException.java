package com.excelisprepas.backend.shared.exception;

import java.util.UUID;

public class ConcoursDejaAjouteAuDossierException extends RuntimeException {
    public ConcoursDejaAjouteAuDossierException(UUID dossierId, UUID concoursId) {
        super("Le concours " + concoursId + " est déjà rattaché au dossier " + dossierId);
    }
}