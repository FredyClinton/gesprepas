package com.excelisprepas.backend.remuneration.infrastructure.in.web.dto;

import com.excelisprepas.backend.remuneration.domain.model.StatutFichePaie;
import com.excelisprepas.backend.remuneration.infrastructure.out.persistence.FichePaieEnseignantEntity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record FichePaieEnseignantItemResponse(
        UUID id,
        UUID bordereauPaieId,
        String referenceBordereau,
        LocalDate datePaiement,
        UUID sessionId,
        UUID enseignantId,
        int nombreSeances,
        BigDecimal montantTotal,
        StatutFichePaie statut
) {
    public static FichePaieEnseignantItemResponse fromEntity(FichePaieEnseignantEntity entity) {
        return new FichePaieEnseignantItemResponse(
                entity.getId(),
                entity.getBordereauPaie() != null ? entity.getBordereauPaie().getId() : null,
                entity.getBordereauPaie() != null ? entity.getBordereauPaie().getReference() : "",
                entity.getBordereauPaie() != null ? entity.getBordereauPaie().getDatePaiement() : null,
                entity.getBordereauPaie() != null ? entity.getBordereauPaie().getSessionId() : null,
                entity.getEnseignantId(),
                entity.getNombreSeances(),
                entity.getMontantTotal(),
                entity.getStatut()
        );
    }
}

