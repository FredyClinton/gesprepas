package com.excelisprepas.backend.dossier.domain.port.in;

import com.excelisprepas.backend.dossier.domain.model.PieceDossier;

import java.util.List;
import java.util.UUID;

public interface ListerPiecesDossierUseCase {
    List<PieceDossier> listerPiecesDossier(UUID dossierConcoursId);
}