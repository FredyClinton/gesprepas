package com.excelisprepas.backend.livre.infrastructure.in.web.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record StatsVentesLivresResponse(
        BigDecimal totalMontant,
        int totalQuantite,
        List<VentilationLivreItem> parLivre,
        List<VentilationCentreItem> parCentre
) {
    public record VentilationLivreItem(
            UUID livreId,
            String titreLivre,
            int quantiteVendue,
            BigDecimal montantTotal
    ) {}

    public record VentilationCentreItem(
            UUID centreId,
            String nomCentre,
            int quantiteVendue,
            BigDecimal montantTotal
    ) {}
}

