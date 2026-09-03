package com.excelisprepas.backend.personnel.infrastructure.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface HistoriqueSalairePersonnelJpaRepository extends JpaRepository<HistoriqueSalairePersonnelEntity, UUID> {

    List<HistoriqueSalairePersonnelEntity> findByPersonnelIdAndSessionId(UUID personnelId, UUID sessionId);

    List<HistoriqueSalairePersonnelEntity> findBySessionId(UUID sessionId);

    @Query("SELECT h FROM HistoriqueSalairePersonnelEntity h WHERE h.personnelId = :personnelId AND h.sessionId = :sessionId AND h.dateDebutEffet <= :datePaiement ORDER BY h.dateDebutEffet DESC, h.dateModification DESC LIMIT 1")
    Optional<HistoriqueSalairePersonnelEntity> findDernierSalaireApplicable(
            @Param("personnelId") UUID personnelId,
            @Param("sessionId") UUID sessionId,
            @Param("datePaiement") LocalDate datePaiement);
}
