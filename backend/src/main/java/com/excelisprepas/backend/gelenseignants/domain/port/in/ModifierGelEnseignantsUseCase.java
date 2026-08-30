package com.excelisprepas.backend.gelenseignants.domain.port.in;

import com.excelisprepas.backend.gelenseignants.domain.model.GelEnseignants;

import java.time.Instant;

public interface ModifierGelEnseignantsUseCase {
    GelEnseignants modifierGel(boolean actif, Instant dateFin);
}
