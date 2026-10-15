package com.excelisprepas.backend.financier.infrastructure.in.web.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record LigneEntreeResumeResponse(
        String categorie,
        UUID formationId,
        String libelle,
        BigDecimal montant,
        int nombreOperations
) {
}
