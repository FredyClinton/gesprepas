package com.excelisprepas.backend.livre.domain.port.in;

import com.excelisprepas.backend.livre.domain.model.Livre;

import java.math.BigDecimal;

public interface CreerLivreUseCase {
    Livre creerLivre(String titre, String description, BigDecimal prix);
}

