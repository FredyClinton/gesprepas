package com.excelisprepas.backend.academie.affectationdepartementale.infrastructure.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AffectationDepartementaleJpaRepository extends JpaRepository<AffectationDepartementaleEntity, UUID> {
    Optional<AffectationDepartementaleEntity> findByEnseignantIdAndSessionIdAndDepartementId(
            UUID enseignantId, UUID sessionId, UUID departementId);

    boolean existsByEnseignantIdAndSessionIdAndDepartementId(UUID enseignantId, UUID sessionId, UUID departementId);

    List<AffectationDepartementaleEntity> findByDepartementIdAndSessionId(UUID departementId, UUID sessionId);

    List<AffectationDepartementaleEntity> findByEnseignantId(UUID enseignantId);
}