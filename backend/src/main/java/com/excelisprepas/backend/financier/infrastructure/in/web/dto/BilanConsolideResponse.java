package com.excelisprepas.backend.financier.infrastructure.in.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record BilanConsolideResponse(
        LocalDate date,
        UUID sessionId,
        BigDecimal totalEntreesNational,
        BigDecimal totalSortiesNational,
        BigDecimal netAVerserNational,
        long totalNouveauxElevesNational,
        long totalEffectifNational,
        int centresCloturesCount,
        int centresTotalCount,
        List<BilanCentreResumeResponse> centres,
        List<LigneEntreeResumeResponse> entreesNationalesDetaillees,
        List<LigneSortieResumeResponse> sortiesNationalesDetaillees,
        List<EffectifFormationResumeResponse> effectifsNationauxParFormation
) {
}
