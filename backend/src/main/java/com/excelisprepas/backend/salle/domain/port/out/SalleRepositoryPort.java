package com.excelisprepas.backend.salle.domain.port.out;

import com.excelisprepas.backend.salle.domain.model.Salle;

import java.util.Optional;
import java.util.UUID;

public interface SalleRepositoryPort {
    Salle save(Salle salle);

    Optional<Salle> findById(UUID id);

    boolean existsByCentreId(UUID centreId);

    boolean existsByFormationId(UUID formationId);
}