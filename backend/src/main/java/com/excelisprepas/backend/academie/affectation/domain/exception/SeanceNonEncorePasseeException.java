package com.excelisprepas.backend.academie.affectation.domain.exception;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Levée quand on tente de marquer "effectuée" une séance dont la date prévue n'est
 * pas encore atteinte. Étend IllegalStateException pour réutiliser le mapping 409
 * déjà en place.
 */
public class SeanceNonEncorePasseeException extends IllegalStateException {
    public SeanceNonEncorePasseeException(UUID affectationId, LocalDate dateSeance) {
        super("Impossible de marquer effectuée l'affectation " + affectationId
                + " : la séance est prévue le " + dateSeance + ", pas encore passée");
    }
}
