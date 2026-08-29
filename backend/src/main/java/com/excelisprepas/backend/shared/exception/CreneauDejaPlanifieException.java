package com.excelisprepas.backend.shared.exception;

import com.excelisprepas.backend.affectation.domain.model.Jour;

import java.util.UUID;

public class CreneauDejaPlanifieException extends RuntimeException {
    public CreneauDejaPlanifieException(UUID salleId, Jour jour, int semaine, int seance) {
        super("Un créneau existe déjà pour la salle " + salleId
                + " le " + jour + " en semaine " + semaine + ", séance " + seance);
    }
}
