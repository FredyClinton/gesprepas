package com.excelisprepas.backend.dossier.domain.model;

import java.math.BigDecimal;
import java.util.UUID;

public record SoldeDossierConcours(UUID dossierConcoursId, BigDecimal montantTotal,
                                   BigDecimal montantPaye, BigDecimal soldeRestant) {
}