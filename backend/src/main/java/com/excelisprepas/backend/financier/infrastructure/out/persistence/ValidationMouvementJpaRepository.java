package com.excelisprepas.backend.financier.infrastructure.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ValidationMouvementJpaRepository extends JpaRepository<ValidationMouvementEntity, UUID> {
    List<ValidationMouvementEntity> findByMouvementFinancierId(UUID mouvementFinancierId);
}