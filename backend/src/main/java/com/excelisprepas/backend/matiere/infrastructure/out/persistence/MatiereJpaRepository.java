package com.excelisprepas.backend.matiere.infrastructure.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface MatiereJpaRepository extends JpaRepository<MatiereEntity, UUID> {
}