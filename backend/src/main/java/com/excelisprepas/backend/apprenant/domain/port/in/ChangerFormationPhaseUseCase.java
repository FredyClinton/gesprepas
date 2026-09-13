package com.excelisprepas.backend.apprenant.domain.port.in;

import com.excelisprepas.backend.apprenant.domain.model.InscriptionPhaseFormation;

import java.util.UUID;

public interface ChangerFormationPhaseUseCase {
    InscriptionPhaseFormation changerFormationPhase(
            UUID apprenantId,
            UUID phaseId,
            UUID nouvelleFormationId
    );
}

