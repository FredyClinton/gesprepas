package com.excelisprepas.backend.financier.infrastructure.out.persistence;

import com.excelisprepas.backend.financier.domain.model.StatutMouvement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface SortieJpaRepository extends JpaRepository<SortieEntity, UUID> {
    List<SortieEntity> findByCentreIdAndSessionIdAndDateAndStatut(UUID centreId, UUID sessionId, LocalDate date, StatutMouvement statut);

    List<SortieEntity> findBySessionId(UUID sessionId);

    List<SortieEntity> findBySessionIdAndCentreId(UUID sessionId, UUID centreId);

    List<SortieEntity> findBySessionIdAndStatut(UUID sessionId, StatutMouvement statut);

    List<SortieEntity> findBySessionIdAndCentreIdAndStatut(UUID sessionId, UUID centreId, StatutMouvement statut);
}