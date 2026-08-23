package com.excelisprepas.backend.matiere.infrastructure.in.web.dto;

import java.util.UUID;

public record MatiereResponse(
        UUID id,
        String nom
) {
}