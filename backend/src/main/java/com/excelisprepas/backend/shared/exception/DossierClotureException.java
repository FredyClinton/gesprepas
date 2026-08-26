package com.excelisprepas.backend.shared.exception;

import java.util.UUID;

public class DossierClotureException extends RuntimeException {
    public DossierClotureException(UUID dossierId) {
        super("Le dossier " + dossierId + " est clôturé");
    }
}