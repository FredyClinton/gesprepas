package com.excelisprepas.backend.shared.exception;

import java.util.UUID;

public class LivreIntrouvableException extends RuntimeException {
    public LivreIntrouvableException(UUID id) {
        super("Livre introuvable avec l'identifiant : " + id);
    }

    public LivreIntrouvableException(String message) {
        super(message);
    }
}

