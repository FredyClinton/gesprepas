package com.excelisprepas.backend.apprenant.domain.port.in;

import com.excelisprepas.backend.apprenant.domain.model.ContratApprenant;
import com.excelisprepas.backend.apprenant.domain.model.InscriptionPhaseFormation;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public interface CreerContratPhaseUseCase {
    record ResultatContratPhase(
            ContratApprenant contrat,
            InscriptionPhaseFormation inscriptionPhase
    ) {}

    ResultatContratPhase creerContratPhase(
            UUID apprenantId,
            UUID phaseId,
            UUID formationId,
            BigDecimal montantContrat,
            LocalDate dateSignature,
            String observations
    );
}

