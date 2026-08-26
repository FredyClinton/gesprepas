package com.excelisprepas.backend.dossier.domain.port.in;

import java.util.UUID;

public interface RetirerPieceDuConcoursUseCase {
    void retirerPieceDuConcours(UUID concoursId, UUID pieceRequiseId);
}