package com.excelisprepas.backend.financier.infrastructure.in.web.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record RepartitionFormationResponse(UUID formationId, BigDecimal montant) {
}