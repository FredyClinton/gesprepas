package com.excelisprepas.backend.shared.exception;

import java.util.UUID;

public class CreneauDejaPlanifieException extends RuntimeException {
    public CreneauDejaPlanifieException(UUID salleId, int semaine, int seance) {
        super("Un créneau existe déjà pour la salle " + salleId
                + " en semaine " + semaine + ", séance " + seance);
    }
}
