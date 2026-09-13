package com.excelisprepas.backend.shared.exception;

import java.math.BigDecimal;
import java.util.UUID;

public class MontantDepasseContratException extends RuntimeException {

    public MontantDepasseContratException(UUID apprenantId, BigDecimal montantSaisi, BigDecimal soldeRestant, BigDecimal montantTotalContrat) {
        super(String.format(
            "Le versement de %s FCFA dépasse le solde restant dû (%s FCFA) pour l'apprenant %s. Montant total des contrats : %s FCFA.",
            montantSaisi, soldeRestant, apprenantId, montantTotalContrat
        ));
    }
}

