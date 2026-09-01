package com.excelisprepas.backend.academie.salle.infrastructure.in.web.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ReaffecterFormationRequest(
        @NotNull(message = "La formation est obligatoire") UUID formationId
) {
}