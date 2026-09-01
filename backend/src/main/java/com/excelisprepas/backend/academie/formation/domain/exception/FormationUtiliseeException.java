package com.excelisprepas.backend.academie.formation.domain.exception;

import java.util.UUID;

/**
 * Levée quand on tente de supprimer une Formation encore référencée
 * par des Salles, Affectations, Apprenants ou Progressions.
 * Étend IllegalStateException pour réutiliser le mapping 409.
 */
public class FormationUtiliseeException extends IllegalStateException {
    public FormationUtiliseeException(UUID formationId) {
        super("Impossible de supprimer la formation " + formationId
                + " : elle est encore référencée par des données existantes");
    }
}