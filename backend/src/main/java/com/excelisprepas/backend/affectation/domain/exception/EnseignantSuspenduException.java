package com.excelisprepas.backend.affectation.domain.exception;

import java.util.UUID;

/**
 * Levée quand on tente d'assigner un enseignant SUSPENDU à un créneau.
 * Étend IllegalStateException pour réutiliser le mapping 409 déjà en place.
 */
public class EnseignantSuspenduException extends IllegalStateException {
    public EnseignantSuspenduException(UUID enseignantId) {
        super("Impossible d'assigner l'enseignant " + enseignantId + " : il est suspendu");
    }
}