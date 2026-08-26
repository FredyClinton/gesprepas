package com.excelisprepas.backend.dossier.infrastructure.in.web.dto;

import java.util.UUID;

public record StatistiqueDossierParCentreResponse(UUID centreId, long nombreDossiers) {
}