package com.excelisprepas.backend.personnel.infrastructure.in.web.dto;

import com.excelisprepas.backend.personnel.domain.model.StatutAcces;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record GererAccesRequest(
        @NotNull(message = "sessionId ne peut pas être nul")
        UUID sessionId,

        UUID phaseId, // nullable : si nul, s'applique à toute la session

        @NotNull(message = "statut ne peut pas être nul")
        StatutAcces statut,

        String motif
) {
}
