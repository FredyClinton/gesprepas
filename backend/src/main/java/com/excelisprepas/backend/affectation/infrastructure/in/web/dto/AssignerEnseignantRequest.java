package com.excelisprepas.backend.affectation.infrastructure.in.web.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AssignerEnseignantRequest(
        @NotNull(message = "L'enseignant est obligatoire") UUID enseignantId
) {
}