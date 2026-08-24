package com.excelisprepas.backend.affectation.infrastructure.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AffectationJpaRepository extends JpaRepository<AffectationEntity, UUID> {
    boolean existsBySalleIdAndSemaineAndSeance(UUID salleId, int semaine, int seance);

    boolean existsByCentreId(UUID centreId);

    boolean existsByEnseignantId(UUID enseignantId);

    boolean existsByFormationId(UUID formationId);

    boolean existsByMatiereId(UUID matiereId);

    boolean existsBySalleId(UUID salleId);
}