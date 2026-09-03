package com.excelisprepas.backend.remuneration.infrastructure.in.web.dto;

import com.excelisprepas.backend.remuneration.domain.model.BordereauPaie;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record BordereauPaieResponse(
        UUID id,
        UUID sessionId,
        String reference,
        LocalDate datePaiement,
        int nombreTotalEnseignants,
        int nombreTotalSeances,
        BigDecimal montantTotalGlobal,
        UUID sortieId
) {
    public static BordereauPaieResponse fromDomain(BordereauPaie bordereau) {
        return new BordereauPaieResponse(
                bordereau.getId(),
                bordereau.getSessionId(),
                bordereau.getReference(),
                bordereau.getDatePaiement(),
                bordereau.getNombreTotalEnseignants(),
                bordereau.getNombreTotalSeances(),
                bordereau.getMontantTotalGlobal(),
                bordereau.getSortieId()
        );
    }
}
