package com.excelisprepas.backend.financier.domain.port.in;

import com.excelisprepas.backend.financier.domain.model.Motif;

import java.util.UUID;

public interface DesactiverMotifUseCase {
    Motif desactiverMotif(UUID id);
}