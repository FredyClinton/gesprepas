package com.excelisprepas.backend.academie.salle.domain.port.out;

import com.excelisprepas.backend.academie.salle.domain.model.Salle;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SalleRepositoryPort {
    Salle save(Salle salle);

    Optional<Salle> findById(UUID id);

    List<Salle> findAll();

    void deleteById(UUID id);

    boolean existsByCentreId(UUID centreId);

    boolean existsByFormationId(UUID formationId);

    List<Salle> findByCentreId(UUID centreId);

    List<Salle> findBySessionId(UUID sessionId);

    List<Salle> findByCentreIdAndSessionId(UUID centreId, UUID sessionId);
}