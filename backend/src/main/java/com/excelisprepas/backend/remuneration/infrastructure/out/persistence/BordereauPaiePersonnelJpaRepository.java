package com.excelisprepas.backend.remuneration.infrastructure.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface BordereauPaiePersonnelJpaRepository extends JpaRepository<BordereauPaiePersonnelEntity, UUID> {
    List<BordereauPaiePersonnelEntity> findBySessionId(UUID sessionId);
}
