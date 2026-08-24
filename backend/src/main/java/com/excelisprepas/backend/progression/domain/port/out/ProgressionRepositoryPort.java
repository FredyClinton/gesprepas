package com.excelisprepas.backend.progression.domain.port.out;

import com.excelisprepas.backend.progression.domain.model.Progression;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProgressionRepositoryPort {
    Progression save(Progression progression);

    Optional<Progression> findById(UUID id);

    List<Progression> findAll();

    void deleteById(UUID id);

    boolean existsByFormationIdAndMatiereIdAndSemaineAndNumeroCours(
            UUID formationId, UUID matiereId, int semaine, int numeroCours);

    boolean existsByFormationId(UUID formationId);

    boolean existsByMatiereId(UUID matiereId);
}