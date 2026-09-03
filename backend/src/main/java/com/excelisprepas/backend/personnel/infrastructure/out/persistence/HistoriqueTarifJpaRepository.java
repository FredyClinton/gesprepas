package com.excelisprepas.backend.personnel.infrastructure.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface HistoriqueTarifJpaRepository extends JpaRepository<HistoriqueTarifEntity, UUID> {
    List<HistoriqueTarifEntity> findByEnseignantIdAndSessionId(UUID enseignantId, UUID sessionId);

    @Query("SELECT h FROM HistoriqueTarifEntity h WHERE h.enseignantId = :enseignantId AND h.sessionId = :sessionId AND h.semaineDebut <= :semaine AND h.semaineFin >= :semaine ORDER BY h.dateModification DESC LIMIT 1")
    Optional<HistoriqueTarifEntity> findTarifApplicable(
            @Param("enseignantId") UUID enseignantId,
            @Param("sessionId") UUID sessionId,
            @Param("semaine") int semaine);
}
