package com.excelisprepas.backend.personnel.infrastructure.in.web.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record RattacherCentreRequest(
        @NotNull(message = "Le centre est obligatoire") UUID centreId
) {
}