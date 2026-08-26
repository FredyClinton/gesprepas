package com.excelisprepas.backend.financier.domain.model;

import java.math.BigDecimal;
import java.util.UUID;

public record RepartitionFormationLigne(UUID formationId, BigDecimal montant) {
}