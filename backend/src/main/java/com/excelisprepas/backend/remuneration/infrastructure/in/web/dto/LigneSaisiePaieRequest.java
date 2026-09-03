package com.excelisprepas.backend.remuneration.infrastructure.in.web.dto;

import com.excelisprepas.backend.remuneration.domain.model.LigneSaisiePaiePersonnel;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record LigneSaisiePaieRequest(
        @NotNull UUID personnelId,
        @NotNull BigDecimal salaireReference,
        @NotNull BigDecimal montantPaye,
        String observations
) {
    public LigneSaisiePaiePersonnel toDomain() {
        return new LigneSaisiePaiePersonnel(personnelId, salaireReference, montantPaye, observations);
    }
}
