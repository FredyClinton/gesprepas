package com.excelisprepas.backend.dossier.domain.port.in;

import com.excelisprepas.backend.dossier.domain.model.Dossier;

import java.util.UUID;

public interface SignalerDossierCompletUseCase {
    Dossier signalerDossierComplet(UUID dossierId);
}