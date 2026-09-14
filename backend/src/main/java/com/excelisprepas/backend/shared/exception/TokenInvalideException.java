package com.excelisprepas.backend.shared.exception;

public class TokenInvalideException extends RuntimeException {
    public TokenInvalideException() {
        super("Token invalide ou expiré");
    }

    public TokenInvalideException(Throwable cause) {
        super("Token invalide ou expiré", cause);
    }
}
