package com.excelisprepas.backend.financier.infrastructure.in.web.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record LigneSortieResumeResponse(
        UUID motifId,
        String libelleMotif,
        BigDecimal montant,
        int nombreOperations
) {
}
