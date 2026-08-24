package com.excelisprepas.backend.shared.exception;

public class MatriculeDejaUtiliseException extends RuntimeException {
    public MatriculeDejaUtiliseException(String matricule) {
        super("Le matricule '" + matricule + "' est déjà utilisé par un autre enseignant");
    }
}
