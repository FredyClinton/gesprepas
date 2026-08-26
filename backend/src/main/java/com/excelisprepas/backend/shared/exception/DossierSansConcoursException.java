package com.excelisprepas.backend.shared.exception;

import java.util.UUID;

public class DossierSansConcoursException extends RuntimeException {
    public DossierSansConcoursException(UUID dossierId) {
        super("Le dossier " + dossierId + " n'a aucun concours rattaché — impossible de le signaler complet");
    }
}