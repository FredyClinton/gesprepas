package com.excelisprepas.backend.financier.domain.model;

import java.math.BigDecimal;
import java.util.UUID;

public record LigneEntreeResume(
        String categorie,
        UUID formationId,
        String libelle,
        BigDecimal montant,
        int nombreOperations
) {
}
