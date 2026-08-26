package com.excelisprepas.backend.financier.domain.port.in;

import com.excelisprepas.backend.financier.domain.model.Motif;
import com.excelisprepas.backend.financier.domain.model.TypeMotif;

public interface CreerMotifUseCase {
    Motif creerMotif(String nom, TypeMotif type);
}