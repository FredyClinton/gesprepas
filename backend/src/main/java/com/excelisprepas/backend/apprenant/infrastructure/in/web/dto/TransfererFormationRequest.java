package com.excelisprepas.backend.apprenant.infrastructure.in.web.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record TransfererFormationRequest(
        @NotNull(message = "La formation est obligatoire") UUID formationId
) {
}