package com.excelisprepas.backend.session.semaine.infrastructure.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SemaineSessionJpaRepository extends JpaRepository<SemaineSessionEntity, UUID> {
    List<SemaineSessionEntity> findBySessionId(UUID sessionId);
    Optional<SemaineSessionEntity> findBySessionIdAndNumero(UUID sessionId, int numero);
}