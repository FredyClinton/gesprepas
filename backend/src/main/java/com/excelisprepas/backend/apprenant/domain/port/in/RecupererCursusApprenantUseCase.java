package com.excelisprepas.backend.apprenant.domain.port.in;

import com.excelisprepas.backend.apprenant.domain.model.ContratApprenant;
import com.excelisprepas.backend.apprenant.domain.model.InscriptionPhaseFormation;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface RecupererCursusApprenantUseCase {
    record CursusComplet(
            UUID apprenantId,
            UUID formationActiveId,
            UUID phaseActiveId,
            BigDecimal montantTotalCumule,
            List<ContratApprenant> contrats,
            List<InscriptionPhaseFormation> inscriptionsPhases
    ) {}

    CursusComplet recupererCursus(UUID apprenantId);
}

