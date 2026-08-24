package com.excelisprepas.backend.progression.infrastructure.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ProgressionJpaRepository extends JpaRepository<ProgressionEntity, UUID> {
    boolean existsByFormationIdAndMatiereIdAndSemaineAndNumeroCours(
            UUID formationId, UUID matiereId, int semaine, int numeroCours);

    boolean existsByFormationId(UUID formationId);
}