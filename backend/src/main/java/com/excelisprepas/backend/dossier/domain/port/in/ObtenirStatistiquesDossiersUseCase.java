package com.excelisprepas.backend.dossier.domain.port.in;

import com.excelisprepas.backend.dossier.domain.model.StatistiqueDossierParCentre;

import java.util.List;
import java.util.UUID;

public interface ObtenirStatistiquesDossiersUseCase {
    List<StatistiqueDossierParCentre> obtenirStatistiques(UUID concoursId, UUID sessionId);
}