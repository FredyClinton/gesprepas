package com.excelisprepas.backend.apprenant.infrastructure.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ApprenantJpaRepository extends JpaRepository<ApprenantEntity, UUID> {
    boolean existsByCentreId(UUID centreId);
}