package com.excelisprepas.backend.shared.exception;

import java.util.UUID;

public class DossierIntrouvableException extends RuntimeException {
    public DossierIntrouvableException(UUID id) {
        super("Aucun dossier trouvé avec l'id : " + id);
    }
}