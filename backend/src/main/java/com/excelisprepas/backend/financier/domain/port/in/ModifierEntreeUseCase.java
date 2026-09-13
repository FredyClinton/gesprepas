package com.excelisprepas.backend.financier.domain.port.in;

import com.excelisprepas.backend.financier.domain.model.Entree;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public interface ModifierEntreeUseCase {
    Entree modifierEntree(UUID entreeId, BigDecimal montant, LocalDate date, UUID motifId, UUID apprenantId);
}

