package com.excelisprepas.backend.dossier.domain.port.in;

import com.excelisprepas.backend.dossier.domain.model.PieceRequise;

import java.math.BigDecimal;
import java.util.UUID;

public interface ModifierPieceRequiseUseCase {
    PieceRequise modifierPieceRequise(UUID id, String nom, BigDecimal montant);
}
