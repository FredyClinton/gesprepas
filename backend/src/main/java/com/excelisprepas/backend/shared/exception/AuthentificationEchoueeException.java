package com.excelisprepas.backend.shared.exception;

public class AuthentificationEchoueeException extends RuntimeException {
    public AuthentificationEchoueeException() {
        super("Email ou mot de passe incorrect");
    }
}
