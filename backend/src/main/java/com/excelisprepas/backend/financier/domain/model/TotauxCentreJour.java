package com.excelisprepas.backend.financier.domain.model;

import java.math.BigDecimal;

public record TotauxCentreJour(
        BigDecimal totalEntrees,
        BigDecimal totalSorties,
        BigDecimal netAVerser,
        int effectifNouveauxEleves,
        int effectifTotalCentre,
        int nombreSalles,
        int nombreCours
) {
    public TotauxCentreJour(BigDecimal totalEntrees, BigDecimal totalSorties, BigDecimal netAVerser,
                           int effectifNouveauxEleves, int effectifTotalCentre) {
        this(totalEntrees, totalSorties, netAVerser, effectifNouveauxEleves, effectifTotalCentre, 0, 0);
    }
}