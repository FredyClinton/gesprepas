package com.excelisprepas.backend.shared.exception;

import java.util.UUID;

public class CentreFermeException extends RuntimeException {
    public CentreFermeException(UUID centreId) {
        super("Le centre " + centreId + " est fermé : aucune planification n'est possible");
    }
}
