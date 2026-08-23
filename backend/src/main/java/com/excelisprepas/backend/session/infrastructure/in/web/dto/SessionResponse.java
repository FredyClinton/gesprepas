package com.excelisprepas.backend.session.infrastructure.in.web.dto;

import com.excelisprepas.backend.session.domain.model.StatutSession;

import java.time.LocalDate;
import java.util.UUID;

public record SessionResponse(
        UUID id,
        String annee,
        LocalDate dateDebut,
        LocalDate dateFin,
        StatutSession statut
) {
}