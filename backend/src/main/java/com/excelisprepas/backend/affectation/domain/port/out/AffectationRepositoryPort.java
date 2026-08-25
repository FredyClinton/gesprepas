package com.excelisprepas.backend.affectation.domain.port.out;

import com.excelisprepas.backend.affectation.domain.model.Affectation;

import java.util.List;
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

    List<Affectation> findBySessionIdAndCentreIdAndSemaine(UUID sessionId, UUID centreId, int semaine);

    List<Affectation> findBySessionIdAndSemaine(UUID sessionId, int semaine);

    List<Affectation> findBySessionIdAndMatiereIdAndSemaine(UUID sessionId, UUID matiereId, int semaine);

    List<Affectation> findBySessionIdAndMatiereIdAndCentreIdAndSemaine(UUID sessionId, UUID matiereId, UUID centreId, int semaine);
}