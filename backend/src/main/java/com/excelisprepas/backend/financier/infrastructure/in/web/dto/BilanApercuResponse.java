// financier/infrastructure/in/web/dto/BilanApercuResponse.java
package com.excelisprepas.backend.financier.infrastructure.in.web.dto;

import com.excelisprepas.backend.financier.domain.model.StatutBilan;

import java.math.BigDecimal;
import java.util.UUID;

public record BilanApercuResponse(
        UUID id, StatutBilan statut, BigDecimal totalEntrees, BigDecimal totalSorties,
        BigDecimal netAVerser, int effectifNouveauxEleves, int effectifTotalCentre
) {
}