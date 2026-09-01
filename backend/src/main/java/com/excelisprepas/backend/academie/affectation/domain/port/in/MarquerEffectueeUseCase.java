package com.excelisprepas.backend.academie.affectation.domain.port.in;

import com.excelisprepas.backend.academie.affectation.domain.model.Affectation;

import java.util.UUID;

public interface MarquerEffectueeUseCase {
    Affectation marquerEffectuee(UUID affectationId);
}
