package com.excelisprepas.backend.personnel.domain.exception;

import java.util.UUID;

/**
 * Levée quand on tente de supprimer un Enseignant encore référencé
 * par des Affectations. Étend IllegalStateException pour réutiliser
 * le mapping 409 déjà en place.
 */
public class EnseignantUtiliseException extends IllegalStateException {
    public EnseignantUtiliseException(UUID enseignantId) {
        super("Impossible de supprimer l'enseignant " + enseignantId
                + " : il est encore référencé par des affectations");
    }
}