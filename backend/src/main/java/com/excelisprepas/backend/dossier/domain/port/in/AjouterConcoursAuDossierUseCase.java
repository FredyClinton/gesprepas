package com.excelisprepas.backend.dossier.domain.port.in;

import com.excelisprepas.backend.dossier.domain.model.DossierConcours;
import com.excelisprepas.backend.dossier.domain.model.SelectionPiece;

import java.util.List;
import java.util.UUID;

public interface AjouterConcoursAuDossierUseCase {
    DossierConcours ajouterConcoursAuDossier(UUID dossierId, UUID concoursId, List<SelectionPiece> selections);
}