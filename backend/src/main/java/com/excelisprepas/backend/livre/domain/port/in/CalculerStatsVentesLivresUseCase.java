package com.excelisprepas.backend.livre.domain.port.in;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface CalculerStatsVentesLivresUseCase {
    record StatsVentes(
            BigDecimal totalMontant,
            int totalQuantite,
            List<VentilationLivre> parLivre,
            List<VentilationCentre> parCentre
    ) {}

    record VentilationLivre(
            UUID livreId,
            String titreLivre,
            int quantiteVendue,
            BigDecimal montantTotal
    ) {}

    record VentilationCentre(
            UUID centreId,
            String nomCentre,
            int quantiteVendue,
            BigDecimal montantTotal
    ) {}

    StatsVentes calculerStats(UUID sessionId, UUID centreId, LocalDate dateDebut, LocalDate dateFin);
}

