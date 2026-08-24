package com.excelisprepas.backend.personnel.domain.port.in;

import com.excelisprepas.backend.personnel.domain.model.Enseignant;

import java.math.BigDecimal;
import java.util.UUID;

public interface ModifierCoutParSeanceUseCase {
    Enseignant modifierCoutParSeance(UUID id, BigDecimal nouveauCout);
}