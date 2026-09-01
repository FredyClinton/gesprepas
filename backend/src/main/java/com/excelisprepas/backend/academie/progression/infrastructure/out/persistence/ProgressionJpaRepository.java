package com.excelisprepas.backend.academie.progression.infrastructure.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ProgressionJpaRepository extends JpaRepository<ProgressionEntity, UUID> {
    boolean existsByFormationIdAndSessionIdAndPhaseIdAndMatiereIdAndSemaineAndNumeroCours(
            UUID formationId, UUID sessionId, UUID phaseId, UUID matiereId, int semaine, int numeroCours);

    boolean existsByFormationId(UUID formationId);

    boolean existsByFormationIdAndMatiereId(UUID formationId, UUID matiereId);

    boolean existsByMatiereId(UUID matiereId);
}