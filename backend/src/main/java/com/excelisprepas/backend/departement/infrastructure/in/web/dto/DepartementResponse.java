package com.excelisprepas.backend.departement.infrastructure.in.web.dto;

import java.util.UUID;

public record DepartementResponse(
        UUID id,
        String nom,
        UUID matiereId
) {
}