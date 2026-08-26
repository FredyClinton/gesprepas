package com.excelisprepas.backend.dossier.infrastructure.in.web.dto;

import com.excelisprepas.backend.dossier.domain.model.StatutPieceDossier;

import java.time.LocalDate;
import java.util.UUID;

public record PieceDossierResponse(
        UUID id, UUID dossierConcoursId, UUID pieceRequiseId, int quantite,
        StatutPieceDossier statut, LocalDate dateValidation
) {
}