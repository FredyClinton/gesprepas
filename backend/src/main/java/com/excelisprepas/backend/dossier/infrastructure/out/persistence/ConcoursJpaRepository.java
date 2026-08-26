package com.excelisprepas.backend.dossier.infrastructure.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ConcoursJpaRepository extends JpaRepository<ConcoursEntity, UUID> {
    List<ConcoursEntity> findBySessionId(UUID sessionId);
}