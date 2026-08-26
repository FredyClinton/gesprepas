package com.excelisprepas.backend.dossier.domain.port.out;

import com.excelisprepas.backend.dossier.domain.model.PieceDossier;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PieceDossierRepositoryPort {
    PieceDossier save(PieceDossier pieceDossier);

    Optional<PieceDossier> findById(UUID id);

    Optional<PieceDossier> findByDossierConcoursIdAndPieceRequiseId(UUID dossierConcoursId, UUID pieceRequiseId);

    List<PieceDossier> findByDossierConcoursId(UUID dossierConcoursId);
}