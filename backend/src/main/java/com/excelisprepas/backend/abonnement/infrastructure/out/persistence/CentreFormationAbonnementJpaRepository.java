package com.excelisprepas.backend.abonnement.infrastructure.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CentreFormationAbonnementJpaRepository extends JpaRepository<CentreFormationAbonnementEntity, UUID> {

    Optional<CentreFormationAbonnementEntity> findByCentreIdAndFormationIdAndSessionId(UUID centreId, UUID formationId, UUID sessionId);

    List<CentreFormationAbonnementEntity> findByCentreId(UUID centreId);

    List<CentreFormationAbonnementEntity> findByCentreIdAndSessionId(UUID centreId, UUID sessionId);

    List<CentreFormationAbonnementEntity> findByFormationId(UUID formationId);

    List<CentreFormationAbonnementEntity> findByFormationIdAndSessionId(UUID formationId, UUID sessionId);

    boolean existsByCentreIdAndFormationIdAndSessionId(UUID centreId, UUID formationId, UUID sessionId);

    boolean existsByCentreId(UUID centreId);

    boolean existsByFormationId(UUID formationId);

    boolean existsBySessionId(UUID sessionId);

    void deleteByCentreIdAndFormationIdAndSessionId(UUID centreId, UUID formationId, UUID sessionId);
}
