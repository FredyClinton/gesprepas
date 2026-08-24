package com.excelisprepas.backend.formation.infrastructure.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface FormationJpaRepository extends JpaRepository<FormationEntity, UUID> {
    boolean existsByCentreId(UUID centreId);

    boolean existsBySessionId(UUID sessionId);
}