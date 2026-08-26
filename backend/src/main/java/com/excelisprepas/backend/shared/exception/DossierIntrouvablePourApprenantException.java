package com.excelisprepas.backend.shared.exception;

import java.util.UUID;

public class DossierIntrouvablePourApprenantException extends RuntimeException {
    public DossierIntrouvablePourApprenantException(UUID apprenantId) {
        super("Aucun dossier trouvé pour l'apprenant " + apprenantId);
    }
}