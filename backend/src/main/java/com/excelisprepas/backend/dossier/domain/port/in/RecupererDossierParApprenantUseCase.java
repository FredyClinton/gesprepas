package com.excelisprepas.backend.dossier.domain.port.in;

import com.excelisprepas.backend.dossier.domain.model.Dossier;

import java.util.UUID;

public interface RecupererDossierParApprenantUseCase {
    Dossier recupererDossierParApprenant(UUID apprenantId);
}