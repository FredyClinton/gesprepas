package com.excelisprepas.backend.apprenant.domain.port.out;

import com.excelisprepas.backend.apprenant.domain.model.InscriptionPhaseFormation;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InscriptionPhaseFormationRepositoryPort {
    InscriptionPhaseFormation save(InscriptionPhaseFormation inscription);
    Optional<InscriptionPhaseFormation> findById(UUID id);
    List<InscriptionPhaseFormation> findByApprenantId(UUID apprenantId);
    Optional<InscriptionPhaseFormation> findByApprenantIdAndPhaseId(UUID apprenantId, UUID phaseId);
    List<InscriptionPhaseFormation> findByPhaseIdAndFormationId(UUID phaseId, UUID formationId);
}

