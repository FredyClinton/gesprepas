package com.excelisprepas.backend.shared.exception;

import java.util.UUID;

public class DossierDejaExistantException extends RuntimeException {
    public DossierDejaExistantException(UUID apprenantId) {
        super("Un dossier existe déjà pour l'apprenant " + apprenantId);
    }
}