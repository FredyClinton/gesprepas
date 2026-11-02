package com.excelisprepas.backend.academie.concoursblanc.infrastructure.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ConcoursBlancJpaRepository extends JpaRepository<ConcoursBlancEntity, UUID> {
    List<ConcoursBlancEntity> findBySessionIdOrderByDateEpreuveAscNumeroAsc(UUID sessionId);

    Optional<ConcoursBlancEntity> findFirstBySessionIdAndNumeroLessThanOrderByNumeroDesc(UUID sessionId, int currentNumero);

    default Optional<ConcoursBlancEntity> findPreviousConcours(UUID sessionId, int currentNumero) {
        return findFirstBySessionIdAndNumeroLessThanOrderByNumeroDesc(sessionId, currentNumero);
    }
}

