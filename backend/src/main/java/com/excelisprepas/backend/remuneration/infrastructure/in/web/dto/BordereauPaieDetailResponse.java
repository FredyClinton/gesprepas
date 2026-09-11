package com.excelisprepas.backend.remuneration.infrastructure.in.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record BordereauPaieDetailResponse(
        UUID id,
        UUID sessionId,
        String reference,
        LocalDate datePaiement,
        int nombreTotalEnseignants,
        int nombreTotalSeances,
        BigDecimal montantTotalGlobal,
        UUID sortieId,
        String saisiPar,
        List<FichePaieEnseignantDetailResponse> fiches
) {}

