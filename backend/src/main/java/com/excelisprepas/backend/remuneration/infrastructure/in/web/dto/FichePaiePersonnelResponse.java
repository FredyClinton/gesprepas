package com.excelisprepas.backend.remuneration.infrastructure.in.web.dto;

import com.excelisprepas.backend.remuneration.domain.model.FichePaiePersonnel;

import java.math.BigDecimal;
import java.util.UUID;

public record FichePaiePersonnelResponse(
        UUID id,
        UUID personnelId,
        BigDecimal salaireReference,
        BigDecimal montantPaye,
        String observations
) {
    public static FichePaiePersonnelResponse fromDomain(FichePaiePersonnel fiche) {
        return new FichePaiePersonnelResponse(
                fiche.getId(),
                fiche.getPersonnelId(),
                fiche.getSalaireReference(),
                fiche.getMontantPaye(),
                fiche.getObservations()
        );
    }
}
