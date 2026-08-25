package com.excelisprepas.backend.centre.infrastructure.in.web.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record RejoindreSessionRequest(
        @NotNull(message = "La session est obligatoire") UUID sessionId
) {
}