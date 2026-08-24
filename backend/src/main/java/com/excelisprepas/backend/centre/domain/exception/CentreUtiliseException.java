package com.excelisprepas.backend.centre.domain.exception;

import java.util.UUID;

/**
 * Levée quand on tente de supprimer un Centre encore référencé par
 * d'autres modules (Formation, Apprenant, Salle, Affectation, Utilisateur).
 * Étend IllegalStateException pour réutiliser le mapping 409 déjà en place
 * dans CentreExceptionHandler, sans dupliquer de handler.
 */
public class CentreUtiliseException extends IllegalStateException {
    public CentreUtiliseException(UUID centreId) {
        super("Impossible de supprimer le centre " + centreId
                + " : il est encore référencé par d'autres données");
    }
}