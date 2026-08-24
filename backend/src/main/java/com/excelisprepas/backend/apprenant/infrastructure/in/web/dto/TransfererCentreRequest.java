package com.excelisprepas.backend.apprenant.infrastructure.in.web.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record TransfererCentreRequest(
        @NotNull(message = "Le centre est obligatoire") UUID centreId
) {
}