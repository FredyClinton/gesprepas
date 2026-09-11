package com.excelisprepas.backend.remuneration.infrastructure.in.web.dto;

import com.excelisprepas.backend.remuneration.domain.model.LigneAjustementPaieEnseignant;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record LigneAjustementPaieRequest(
        @NotNull UUID enseignantId,
        @NotNull @PositiveOrZero BigDecimal coutParSeance,
        List<UUID> affectationIds
) {
    public LigneAjustementPaieEnseignant toDomain() {
        return new LigneAjustementPaieEnseignant(enseignantId, coutParSeance, affectationIds);
    }
}

