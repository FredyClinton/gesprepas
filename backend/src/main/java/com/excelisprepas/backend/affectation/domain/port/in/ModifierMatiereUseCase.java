package com.excelisprepas.backend.affectation.domain.port.in;

import com.excelisprepas.backend.affectation.domain.model.Affectation;

import java.util.UUID;

public interface ModifierMatiereUseCase {
    Affectation modifierMatiere(UUID affectationId, UUID nouvelleMatiereId);
}
