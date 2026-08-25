package com.excelisprepas.backend.salle.infrastructure.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SalleJpaRepository extends JpaRepository<SalleEntity, UUID> {
    boolean existsByCentreId(UUID centreId);

    boolean existsByFormationId(UUID formationId);

    List<SalleEntity> findByCentreId(UUID centreId);

    List<SalleEntity> findBySessionId(UUID sessionId);

    List<SalleEntity> findByCentreIdAndSessionId(UUID centreId, UUID sessionId);
}