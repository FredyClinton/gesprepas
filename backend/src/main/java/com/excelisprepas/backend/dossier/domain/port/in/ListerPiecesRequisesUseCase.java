package com.excelisprepas.backend.dossier.domain.port.in;

import com.excelisprepas.backend.dossier.domain.model.PieceRequise;

import java.util.List;

public interface ListerPiecesRequisesUseCase {
    List<PieceRequise> listerPiecesRequises();
}
