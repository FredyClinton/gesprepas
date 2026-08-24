package com.excelisprepas.backend.affectation.domain.port.out;

import com.excelisprepas.backend.affectation.domain.model.Affectation;

import java.util.Optional;
import java.util.UUID;

public interface AffectationRepositoryPort {
    Affectation save(Affectation affectation);

    Optional<Affectation> findById(UUID id);

    boolean existsBySalleIdAndSemaineAndSeance(UUID salleId, int semaine, int seance);

    boolean existsByCentreId(UUID centreId);

    boolean existsByEnseignantId(UUID enseignantId);

    boolean existsByFormationId(UUID formationId);

    boolean existsByMatiereId(UUID matiereId);

    boolean existsBySalleId(UUID salleId);
}