package com.excelisprepas.backend.dossier.domain.port.in;

import com.excelisprepas.backend.dossier.domain.model.DossierConcours;

import java.util.List;
import java.util.UUID;

public interface ListerDossierConcoursUseCase {
    List<DossierConcours> listerDossierConcours(UUID dossierId);
}