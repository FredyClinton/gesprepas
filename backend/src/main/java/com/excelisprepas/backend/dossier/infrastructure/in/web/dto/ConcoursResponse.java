package com.excelisprepas.backend.dossier.infrastructure.in.web.dto;

import java.time.LocalDate;
import java.util.UUID;

public record ConcoursResponse(
        UUID id, String nom, UUID sessionId, UUID formationId, UUID phaseId, LocalDate dateLimiteDepot, LocalDate dateLimiteRecevabiliteCentre
) {
}