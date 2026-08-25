package com.excelisprepas.backend.affectationdepartementale.infrastructure.in.web.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AjouterEnseignantRequest(
        @NotNull(message = "Le département est obligatoire") UUID departementId,
        @NotNull(message = "La session est obligatoire") UUID sessionId,
        @NotNull(message = "L'enseignant est obligatoire") UUID enseignantId
) {
}