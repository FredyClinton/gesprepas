package com.excelisprepas.backend.shared.exception;

public class LivreIndisponibleException extends RuntimeException {
    public LivreIndisponibleException(String titreLivre) {
        super("Le livre '" + titreLivre + "' n'est pas disponible à la vente");
    }
}
