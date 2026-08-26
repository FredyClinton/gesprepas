// dossier/domain/port/in/AjouterPieceAuConcoursUseCase.java
package com.excelisprepas.backend.dossier.domain.port.in;

import com.excelisprepas.backend.dossier.domain.model.ConcoursPieceRequise;

import java.util.UUID;

public interface AjouterPieceAuConcoursUseCase {
    ConcoursPieceRequise ajouterPieceAuConcours(UUID concoursId, UUID pieceRequiseId);
}