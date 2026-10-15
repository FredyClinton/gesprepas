package com.excelisprepas.backend.financier.domain.model;

import java.math.BigDecimal;
import java.util.UUID;

public record LigneSortieResume(
        UUID motifId,
        String libelleMotif,
        BigDecimal montant,
        int nombreOperations
) {
}
