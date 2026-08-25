package com.excelisprepas.backend.shared.exception;

import java.util.UUID;

public class RattachementIntrouvableException extends RuntimeException {
    public RattachementIntrouvableException(UUID id) {
        super("Aucun rattachement trouvé avec l'id : " + id);
    }
}