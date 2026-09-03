package com.excelisprepas.backend.remuneration.infrastructure.in.web.dto;

import com.excelisprepas.backend.remuneration.domain.model.BordereauPaiePersonnel;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record BordereauPaiePersonnelResponse(
        UUID id,
        UUID sessionId,
        String reference,
        String intitule,
        LocalDate datePaiement,
        int nombrePersonnelsPayes,
        BigDecimal montantTotalGlobal,
        UUID sortieId,
        List<FichePaiePersonnelResponse> fiches
) {
    public static BordereauPaiePersonnelResponse fromDomain(BordereauPaiePersonnel bordereau) {
        return new BordereauPaiePersonnelResponse(
                bordereau.getId(),
                bordereau.getSessionId(),
                bordereau.getReference(),
                bordereau.getIntitule(),
                bordereau.getDatePaiement(),
                bordereau.getNombrePersonnelsPayes(),
                bordereau.getMontantTotalGlobal(),
                bordereau.getSortieId(),
                bordereau.getFiches().stream().map(FichePaiePersonnelResponse::fromDomain).toList()
        );
    }
}
