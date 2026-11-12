package com.excelisprepas.backend.personnel.domain.exception;

/**
 * Le mot de passe actuel saisi par l'utilisateur pour changer son propre mot de passe ne
 * correspond pas. Traduite en 400 par PersonnelExceptionHandler (pas 401 : la session reste
 * valide, seule la saisie est fausse).
 */
public class MotDePasseActuelIncorrectException extends RuntimeException {

    public MotDePasseActuelIncorrectException() {
        super("Le mot de passe actuel est incorrect.");
    }
}
