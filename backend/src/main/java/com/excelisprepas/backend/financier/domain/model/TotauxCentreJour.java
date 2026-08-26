package com.excelisprepas.backend.financier.domain.model;

import java.math.BigDecimal;

public record TotauxCentreJour(BigDecimal totalEntrees, BigDecimal totalSorties, BigDecimal netAVerser,
                               int effectifNouveauxEleves, int effectifTotalCentre) {
}