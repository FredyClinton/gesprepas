package com.excelisprepas.backend.academie.phase.infrastructure.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface PhaseJpaRepository extends JpaRepository<PhaseEntity, UUID> {
    Optional<PhaseEntity> findByCode(String code);
}

