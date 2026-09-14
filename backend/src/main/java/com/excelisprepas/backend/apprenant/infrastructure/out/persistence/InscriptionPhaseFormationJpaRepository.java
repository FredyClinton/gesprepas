package com.excelisprepas.backend.apprenant.infrastructure.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;


import java.util.List;
import java.util.Optional;
import java.util.UUID;


public interface InscriptionPhaseFormationJpaRepository extends JpaRepository<InscriptionPhaseFormationEntity, UUID> {
    List<InscriptionPhaseFormationEntity> findByApprenantIdOrderByDateDebutDesc(UUID apprenantId);
    Optional<InscriptionPhaseFormationEntity> findByApprenantIdAndPhaseId(UUID apprenantId, UUID phaseId);
    List<InscriptionPhaseFormationEntity> findByPhaseIdAndFormationId(UUID phaseId, UUID formationId);
}

