package com.excelisprepas.backend.shared.exception;

import java.util.UUID;

public class DossierConcoursIntrouvableException extends RuntimeException {
    public DossierConcoursIntrouvableException(UUID id) {
        super("Aucun DossierConcours trouvé avec l'id : " + id);
    }
}