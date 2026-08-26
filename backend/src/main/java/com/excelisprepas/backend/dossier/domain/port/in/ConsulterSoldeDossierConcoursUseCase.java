package com.excelisprepas.backend.dossier.domain.port.in;

import com.excelisprepas.backend.dossier.domain.model.SoldeDossierConcours;

import java.util.UUID;

public interface ConsulterSoldeDossierConcoursUseCase {
    SoldeDossierConcours consulterSolde(UUID dossierConcoursId);
}