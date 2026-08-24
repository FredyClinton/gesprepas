package com.excelisprepas.backend.salle.infrastructure.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface SalleJpaRepository extends JpaRepository<SalleEntity, UUID> {
    boolean existsByCentreId(UUID centreId);
}