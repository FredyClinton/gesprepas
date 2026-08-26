package com.excelisprepas.backend.shared.exception;

import java.util.UUID;

public class MotifInactifException extends RuntimeException {
    public MotifInactifException(UUID motifId) {
        super("Le motif " + motifId + " est désactivé et ne peut plus être utilisé");
    }
}