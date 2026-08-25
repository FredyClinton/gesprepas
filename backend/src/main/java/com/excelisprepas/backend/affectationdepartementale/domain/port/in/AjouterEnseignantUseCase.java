package com.excelisprepas.backend.affectationdepartementale.domain.port.in;

import com.excelisprepas.backend.affectationdepartementale.domain.model.AffectationDepartementale;

import java.util.UUID;

public interface AjouterEnseignantUseCase {
    AffectationDepartementale ajouterEnseignant(UUID departementId, UUID sessionId, UUID enseignantId);
}