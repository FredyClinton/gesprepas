package com.excelisprepas.backend.livre.domain.port.in;

import com.excelisprepas.backend.livre.domain.model.Livre;

import java.math.BigDecimal;
import java.util.UUID;

public interface ModifierLivreUseCase {
    Livre modifierLivre(UUID id, String titre, String description, BigDecimal prix, boolean actif);
}

