package com.excelisprepas.backend.dossier.domain.port.in;

import com.excelisprepas.backend.dossier.domain.model.PieceRequise;

import java.util.List;
import java.util.UUID;

public interface ListerPiecesDuConcoursUseCase {
    List<PieceRequise> listerPiecesDuConcours(UUID concoursId);
}