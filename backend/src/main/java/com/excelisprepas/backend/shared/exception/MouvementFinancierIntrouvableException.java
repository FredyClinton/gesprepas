package com.excelisprepas.backend.shared.exception;

import java.util.UUID;

public class MouvementFinancierIntrouvableException extends RuntimeException {
    public MouvementFinancierIntrouvableException(UUID id) {
        super("Aucun mouvement financier trouvé avec l'id : " + id);
    }
}