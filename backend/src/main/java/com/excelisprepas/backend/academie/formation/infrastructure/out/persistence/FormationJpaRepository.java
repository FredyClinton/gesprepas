package com.excelisprepas.backend.academie.formation.infrastructure.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface FormationJpaRepository extends JpaRepository<FormationEntity, UUID> {
    boolean existsByMatiereIdsContains(UUID matiereId);
}