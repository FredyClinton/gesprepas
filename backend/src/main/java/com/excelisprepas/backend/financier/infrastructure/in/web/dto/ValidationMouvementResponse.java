package com.excelisprepas.backend.financier.infrastructure.in.web.dto;

import com.excelisprepas.backend.financier.domain.model.StatutMouvement;

import java.time.LocalDateTime;
import java.util.UUID;

public record ValidationMouvementResponse(
        UUID id, UUID mouvementFinancierId, UUID validateurUtilisateurId, StatutMouvement decision, LocalDateTime date
) {
}