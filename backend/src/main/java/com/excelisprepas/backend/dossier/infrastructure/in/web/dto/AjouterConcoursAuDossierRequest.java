package com.excelisprepas.backend.dossier.infrastructure.in.web.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record AjouterConcoursAuDossierRequest(
        @NotNull(message = "Le concours est obligatoire") UUID concoursId,
        @NotEmpty(message = "Au moins une pièce doit être sélectionnée") List<SelectionPieceRequest> selections
) {
}