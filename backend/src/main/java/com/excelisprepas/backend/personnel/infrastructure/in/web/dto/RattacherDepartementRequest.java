package com.excelisprepas.backend.personnel.infrastructure.in.web.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record RattacherDepartementRequest(
        @NotNull(message = "Le département est obligatoire") UUID departementId
) {
}
