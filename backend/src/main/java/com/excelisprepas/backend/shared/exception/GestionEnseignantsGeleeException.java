package com.excelisprepas.backend.shared.exception;

public class GestionEnseignantsGeleeException extends RuntimeException {
    public GestionEnseignantsGeleeException() {
        super("La gestion des enseignants est actuellement gelée par le Directeur Académique.");
    }
}
