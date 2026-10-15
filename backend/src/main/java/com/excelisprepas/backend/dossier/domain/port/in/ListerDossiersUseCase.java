package com.excelisprepas.backend.dossier.domain.port.in;

import com.excelisprepas.backend.dossier.domain.model.Dossier;

import java.util.List;
import java.util.UUID;

public interface ListerDossiersUseCase {
    List<Dossier> listerDossiers(UUID sessionId, UUID centreId);
}
