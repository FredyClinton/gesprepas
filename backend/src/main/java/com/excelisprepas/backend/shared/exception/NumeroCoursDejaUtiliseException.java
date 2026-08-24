package com.excelisprepas.backend.shared.exception;

import java.util.UUID;

public class NumeroCoursDejaUtiliseException extends RuntimeException {
    public NumeroCoursDejaUtiliseException(UUID formationId, UUID matiereId, int semaine, int numeroCours) {
        super("Le cours n°" + numeroCours + " existe déjà pour la formation " + formationId
                + ", matière " + matiereId + ", semaine " + semaine);
    }
}