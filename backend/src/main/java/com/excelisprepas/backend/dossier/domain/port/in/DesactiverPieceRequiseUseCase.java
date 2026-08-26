package com.excelisprepas.backend.dossier.domain.port.in;

import com.excelisprepas.backend.dossier.domain.model.PieceRequise;

import java.util.UUID;

public interface DesactiverPieceRequiseUseCase {
    PieceRequise desactiverPieceRequise(UUID id);
}
