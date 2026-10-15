package com.excelisprepas.backend.apprenant.infrastructure.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.UUID;

public interface ApprenantJpaRepository extends JpaRepository<ApprenantEntity, UUID> {
    boolean existsByCentreId(UUID centreId);

    long countByCentreIdAndSessionId(UUID centreId, UUID sessionId);

    long countByCentreIdAndSessionIdAndDateInscription(UUID centreId, UUID sessionId, LocalDate dateInscription);

    java.util.List<ApprenantEntity> findByCentreIdAndSessionId(UUID centreId, UUID sessionId);
}
