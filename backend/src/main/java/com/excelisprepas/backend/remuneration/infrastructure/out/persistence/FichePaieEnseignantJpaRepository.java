package com.excelisprepas.backend.remuneration.infrastructure.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface FichePaieEnseignantJpaRepository extends JpaRepository<FichePaieEnseignantEntity, UUID> {

    @Query("SELECT f FROM FichePaieEnseignantEntity f JOIN FETCH f.bordereauPaie b WHERE f.enseignantId = :enseignantId ORDER BY b.datePaiement DESC")
    List<FichePaieEnseignantEntity> findByEnseignantIdOrderByDatePaiementDesc(@Param("enseignantId") UUID enseignantId);

    @Query("SELECT f FROM FichePaieEnseignantEntity f JOIN FETCH f.bordereauPaie b WHERE f.enseignantId = :enseignantId AND b.sessionId = :sessionId ORDER BY b.datePaiement DESC")
    List<FichePaieEnseignantEntity> findByEnseignantIdAndSessionIdOrderByDatePaiementDesc(
            @Param("enseignantId") UUID enseignantId,
            @Param("sessionId") UUID sessionId
    );
}

