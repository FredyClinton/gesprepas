package com.excelisprepas.backend.academie.affectation.infrastructure.in.web.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ModifierMatiereRequest(
        @NotNull(message = "La matière est obligatoire") UUID matiereId
) {
}
