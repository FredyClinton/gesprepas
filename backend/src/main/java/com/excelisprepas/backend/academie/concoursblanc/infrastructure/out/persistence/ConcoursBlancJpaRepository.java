package com.excelisprepas.backend.academie.concoursblanc.infrastructure.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ConcoursBlancJpaRepository extends JpaRepository<ConcoursBlancEntity, UUID> {
    List<ConcoursBlancEntity> findBySessionIdOrderByDateEpreuveAscNumeroAsc(UUID sessionId);

    @Query("SELECT cb FROM ConcoursBlancEntity cb WHERE cb.sessionId = :sessionId AND cb.numero < :currentNumero ORDER BY cb.numero DESC LIMIT 1")
    Optional<ConcoursBlancEntity> findPreviousConcours(@Param("sessionId") UUID sessionId, @Param("currentNumero") int currentNumero);
}

