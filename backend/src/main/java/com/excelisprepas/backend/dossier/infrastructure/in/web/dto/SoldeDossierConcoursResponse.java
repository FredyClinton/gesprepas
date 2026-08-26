package com.excelisprepas.backend.dossier.infrastructure.in.web.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record SoldeDossierConcoursResponse(
        UUID dossierConcoursId, BigDecimal montantTotal, BigDecimal montantPaye, BigDecimal soldeRestant
) {
}