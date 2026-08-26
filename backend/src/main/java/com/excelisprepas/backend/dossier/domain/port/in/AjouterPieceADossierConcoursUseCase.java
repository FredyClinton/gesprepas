package com.excelisprepas.backend.dossier.domain.port.in;

import com.excelisprepas.backend.dossier.domain.model.PieceDossier;

import java.util.UUID;

public interface AjouterPieceADossierConcoursUseCase {
    PieceDossier ajouterPieceADossierConcours(UUID dossierConcoursId, UUID pieceRequiseId, int quantite);
}