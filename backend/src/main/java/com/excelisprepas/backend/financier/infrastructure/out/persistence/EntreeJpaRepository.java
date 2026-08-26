// financier/infrastructure/out/persistence/EntreeJpaRepository.java
package com.excelisprepas.backend.financier.infrastructure.out.persistence;

import com.excelisprepas.backend.financier.domain.model.StatutMouvement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface EntreeJpaRepository extends JpaRepository<EntreeEntity, UUID> {
    List<EntreeEntity> findByApprenantId(UUID apprenantId);

    List<EntreeEntity> findByCentreIdAndSessionIdAndDateAndStatut(UUID centreId, UUID sessionId, LocalDate date, StatutMouvement statut);

    List<EntreeEntity> findByBilanJournalierId(UUID bilanJournalierId);

    List<EntreeEntity> findBySessionId(UUID sessionId);

    List<EntreeEntity> findBySessionIdAndCentreId(UUID sessionId, UUID centreId);

    List<EntreeEntity> findBySessionIdAndStatut(UUID sessionId, StatutMouvement statut);

    List<EntreeEntity> findBySessionIdAndCentreIdAndStatut(UUID sessionId, UUID centreId, StatutMouvement statut);

    List<EntreeEntity> findByDossierConcoursId(UUID dossierConcoursId);
}