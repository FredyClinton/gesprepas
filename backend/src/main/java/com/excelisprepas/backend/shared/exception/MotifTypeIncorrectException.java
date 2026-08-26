package com.excelisprepas.backend.shared.exception;

import com.excelisprepas.backend.financier.domain.model.TypeMotif;

import java.util.UUID;

public class MotifTypeIncorrectException extends RuntimeException {
    public MotifTypeIncorrectException(UUID motifId, TypeMotif attendu, TypeMotif recu) {
        super("Le motif " + motifId + " est de type " + recu + ", attendu : " + attendu);
    }
}