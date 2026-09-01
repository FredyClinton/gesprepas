package com.excelisprepas.backend.academie.progression.domain.port.out;

import com.excelisprepas.backend.academie.progression.domain.model.Progression;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProgressionRepositoryPort {
    Progression save(Progression progression);

    Optional<Progression> findById(UUID id);

    List<Progression> findAll();

    void deleteById(UUID id);

    boolean existsByFormationIdAndSessionIdAndPhaseIdAndMatiereIdAndSemaineAndNumeroCours(
            UUID formationId, UUID sessionId, UUID phaseId, UUID matiereId, int semaine, int numeroCours);

    boolean existsByFormationId(UUID formationId);

    boolean existsByFormationIdAndMatiereId(UUID formationId, UUID matiereId);

    boolean existsByMatiereId(UUID matiereId);
}