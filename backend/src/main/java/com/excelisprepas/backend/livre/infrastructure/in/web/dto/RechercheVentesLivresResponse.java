package com.excelisprepas.backend.livre.infrastructure.in.web.dto;

import com.excelisprepas.backend.shared.infrastructure.in.web.dto.PageResponse;

import java.math.BigDecimal;

/** Page de ventes + agrégats de toute la sélection filtrée. */
public record RechercheVentesLivresResponse(
        PageResponse<VenteLivreResponse> page,
        BigDecimal totalMontant,
        long totalQuantite,
        long nbInternes,
        BigDecimal montantInternes,
        long nbExternes,
        BigDecimal montantExternes
) {
}
