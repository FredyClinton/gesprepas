package com.excelisprepas.backend.financier.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record BilanConsolideNational(
        LocalDate date,
        UUID sessionId,
        BigDecimal totalEntreesNational,
        BigDecimal totalSortiesNational,
        BigDecimal netAVerserNational,
        long totalNouveauxElevesNational,
        long totalEffectifNational,
        int centresCloturesCount,
        int centresTotalCount,
        List<BilanCentreResume> centres,
        List<LigneEntreeResume> entreesNationalesDetaillees,
        List<LigneSortieResume> sortiesNationalesDetaillees,
        List<EffectifFormationResume> effectifsNationauxParFormation
) {
    public BilanConsolideNational {
        centres = centres != null ? List.copyOf(centres) : List.of();
        entreesNationalesDetaillees = entreesNationalesDetaillees != null ? List.copyOf(entreesNationalesDetaillees) : List.of();
        sortiesNationalesDetaillees = sortiesNationalesDetaillees != null ? List.copyOf(sortiesNationalesDetaillees) : List.of();
        effectifsNationauxParFormation = effectifsNationauxParFormation != null ? List.copyOf(effectifsNationauxParFormation) : List.of();
    }
}
