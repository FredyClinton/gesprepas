package com.excelisprepas.backend.dossier.infrastructure.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface DossierJpaRepository extends JpaRepository<DossierEntity, UUID> {
    Optional<DossierEntity> findByApprenantId(UUID apprenantId);

    boolean existsByApprenantId(UUID apprenantId);
}