package com.excelisprepas.backend.financier.domain.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record BilanCentreResume(
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
        List<LigneEntreeResume> entreesDetaillees,
        List<LigneSortieResume> sortiesDetaillees,
        List<EffectifFormationResume> effectifsParFormation
) {
    public BilanCentreResume {
        entreesDetaillees = entreesDetaillees != null ? List.copyOf(entreesDetaillees) : List.of();
        sortiesDetaillees = sortiesDetaillees != null ? List.copyOf(sortiesDetaillees) : List.of();
        effectifsParFormation = effectifsParFormation != null ? List.copyOf(effectifsParFormation) : List.of();
    }
}
