package com.excelisprepas.backend.dossier.domain.model;

import java.util.UUID;

public record StatistiqueDossierParCentre(UUID centreId, long nombreDossiers) {
}