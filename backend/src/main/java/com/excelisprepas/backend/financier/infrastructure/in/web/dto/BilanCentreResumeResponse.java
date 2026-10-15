package com.excelisprepas.backend.financier.infrastructure.in.web.dto;

import com.excelisprepas.backend.financier.domain.model.StatutBilan;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record BilanCentreResumeResponse(
        UUID centreId,
        String centreNom,
        String centreVille,
        StatutBilan statut,
        BigDecimal totalEntrees,
        BigDecimal totalSorties,
        BigDecimal netAVerser,
        int effectifNouveauxElevesTotal,
        int effectifTotalCentre,
        int nombreSalles,
        int nombreCours,
        String nomCaissier,
        LocalDateTime dateVisaCaissier,
        String nomChefCentre,
        LocalDateTime dateValidationChefCentre,
        String nomControleur,
        LocalDateTime dateValidationControleur,
        List<LigneEntreeResumeResponse> entreesDetaillees,
        List<LigneSortieResumeResponse> sortiesDetaillees,
        List<EffectifFormationResumeResponse> effectifsParFormation
) {
}
