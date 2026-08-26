package com.excelisprepas.backend.dossier.domain.port.out;

import com.excelisprepas.backend.dossier.domain.model.ConcoursPieceRequise;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ConcoursPieceRequiseRepositoryPort {
    ConcoursPieceRequise save(ConcoursPieceRequise association);

    Optional<ConcoursPieceRequise> findByConcoursIdAndPieceRequiseId(UUID concoursId, UUID pieceRequiseId);

    boolean existsByConcoursIdAndPieceRequiseId(UUID concoursId, UUID pieceRequiseId);

    List<ConcoursPieceRequise> findByConcoursId(UUID concoursId);

    void deleteById(UUID id);
}