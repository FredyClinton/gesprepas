package com.excelisprepas.backend.personnel.domain.exception;

public class EmailDejaUtiliseException extends RuntimeException {
    public EmailDejaUtiliseException(String email) {
        super("L'email '" + email + "' est déjà utilisé par un autre utilisateur");
    }
}
