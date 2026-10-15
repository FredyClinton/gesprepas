package com.excelisprepas.backend.financier.infrastructure.in.web.dto;

import com.excelisprepas.backend.financier.domain.model.StatutBilan;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record BilanApercuResponse(
        UUID id,
        StatutBilan statut,
        BigDecimal totalEntrees,
        BigDecimal totalSorties,
        BigDecimal netAVerser,
        int effectifNouveauxEleves,
        int effectifTotalCentre,
        int nombreSalles,
        int nombreCours,
        LocalDateTime dateVisaCaissier,
        String nomCaissier,
        LocalDateTime dateValidationChefCentre,
        String nomChefCentre,
        LocalDateTime dateValidationControleur,
        String nomControleur
) {
    public BilanApercuResponse(UUID id, StatutBilan statut, BigDecimal totalEntrees, BigDecimal totalSorties,
                               BigDecimal netAVerser, int effectifNouveauxEleves, int effectifTotalCentre) {
        this(id, statut, totalEntrees, totalSorties, netAVerser, effectifNouveauxEleves, effectifTotalCentre,
                0, 0, null, null, null, null, null, null);
    }
}