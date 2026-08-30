package com.excelisprepas.backend.centre.infrastructure.in.web.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record LocalisationCentreResponse(
        UUID id,
        String adresse,
        String ville,
        LocalDateTime dateDebutValidite,
        LocalDateTime dateFinValidite
) {
}
