package com.excelisprepas.backend.abonnement.domain.port.out;

import com.excelisprepas.backend.abonnement.domain.model.CentreFormationAbonnement;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CentreFormationAbonnementRepositoryPort {

    CentreFormationAbonnement save(CentreFormationAbonnement abonnement);

    Optional<CentreFormationAbonnement> findById(UUID id);

    Optional<CentreFormationAbonnement> findByCentreIdAndFormationIdAndSessionId(UUID centreId, UUID formationId, UUID sessionId);

    List<CentreFormationAbonnement> findByCentreId(UUID centreId);

    List<CentreFormationAbonnement> findByCentreIdAndSessionId(UUID centreId, UUID sessionId);

    List<CentreFormationAbonnement> findByFormationId(UUID formationId);

    List<CentreFormationAbonnement> findByFormationIdAndSessionId(UUID formationId, UUID sessionId);

    List<CentreFormationAbonnement> findAll();

    boolean existsByCentreIdAndFormationIdAndSessionId(UUID centreId, UUID formationId, UUID sessionId);

    boolean existsByCentreId(UUID centreId);

    boolean existsByFormationId(UUID formationId);

    boolean existsBySessionId(UUID sessionId);

    void deleteById(UUID id);

    void deleteByCentreIdAndFormationIdAndSessionId(UUID centreId, UUID formationId, UUID sessionId);
}
