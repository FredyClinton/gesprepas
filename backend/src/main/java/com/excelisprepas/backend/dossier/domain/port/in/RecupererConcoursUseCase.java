package com.excelisprepas.backend.dossier.domain.port.in;

import com.excelisprepas.backend.dossier.domain.model.Concours;

import java.util.UUID;

public interface RecupererConcoursUseCase {
    Concours recupererConcours(UUID concoursId);
}