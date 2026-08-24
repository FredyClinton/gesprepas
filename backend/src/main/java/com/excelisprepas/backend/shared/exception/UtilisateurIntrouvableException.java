package com.excelisprepas.backend.shared.exception;

import java.util.UUID;

public class UtilisateurIntrouvableException extends RuntimeException {
    public UtilisateurIntrouvableException(UUID id) {
        super("Aucun utilisateur trouvé avec l'id : " + id);
    }
}