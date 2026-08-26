package com.excelisprepas.backend.dossier.domain.port.out;

import com.excelisprepas.backend.dossier.domain.model.PieceRequise;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PieceRequiseRepositoryPort {
    PieceRequise save(PieceRequise pieceRequise);

    Optional<PieceRequise> findById(UUID id);

    List<PieceRequise> findAll();
}