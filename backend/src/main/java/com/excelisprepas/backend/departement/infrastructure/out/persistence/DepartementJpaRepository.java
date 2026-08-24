package com.excelisprepas.backend.departement.infrastructure.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface DepartementJpaRepository extends JpaRepository<DepartementEntity, UUID> {
    boolean existsByMatiereId(UUID matiereId);
}