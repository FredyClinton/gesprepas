package com.excelisprepas.backend.financier.infrastructure.in.web.dto;

import com.excelisprepas.backend.shared.infrastructure.in.web.dto.PageResponse;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Page de mouvements + totaux de toute la sélection filtrée : {@code totalEntrees}/{@code totalSorties} excluent les
 * rejetés, {@code totauxParMotif} les inclut.
 */
public record RechercheMouvementsResponse(
        PageResponse<LigneMouvementResponse> page,
        BigDecimal totalEntrees,
        BigDecimal totalSorties,
        List<TotalMotifResponse> totauxParMotif
) {
    public record TotalMotifResponse(UUID motifId, String type, BigDecimal total, long nombre) {
    }
}
