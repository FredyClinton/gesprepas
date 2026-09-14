package com.excelisprepas.backend.shared.exception;

import java.util.UUID;

public class QuotaHebdomadaireDepasseException extends RuntimeException {
    public QuotaHebdomadaireDepasseException(UUID formationId, UUID matiereId, int semaine, int quota) {
        super("Le quota de " + quota + " cours pour la matière " + matiereId + " en semaine " + semaine
                + " (formation " + formationId + ") est déjà atteint.");
    }
}
