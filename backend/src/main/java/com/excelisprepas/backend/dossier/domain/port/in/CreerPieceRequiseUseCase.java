package com.excelisprepas.backend.dossier.domain.port.in;

import com.excelisprepas.backend.dossier.domain.model.PieceRequise;

import java.math.BigDecimal;

public interface CreerPieceRequiseUseCase {
    PieceRequise creerPieceRequise(String nom, BigDecimal montant);
}
