package com.excelisprepas.backend.personnel.infrastructure.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AccesPersonnelJpaRepository extends JpaRepository<AccesPersonnelEntity, UUID> {

    @Query("SELECT a FROM AccesPersonnelEntity a WHERE a.personnelId = :personnelId AND a.sessionId = :sessionId AND (:phaseId IS NULL AND a.phaseId IS NULL OR a.phaseId = :phaseId)")
    Optional<AccesPersonnelEntity> findByPersonnelIdAndSessionIdAndPhaseIdNullable(
            @Param("personnelId") UUID personnelId,
            @Param("sessionId") UUID sessionId,
            @Param("phaseId") UUID phaseId);

    List<AccesPersonnelEntity> findByPersonnelIdAndSessionId(UUID personnelId, UUID sessionId);

    List<AccesPersonnelEntity> findByPersonnelId(UUID personnelId);

    List<AccesPersonnelEntity> findBySessionId(UUID sessionId);

    List<AccesPersonnelEntity> findBySessionIdAndPhaseId(UUID sessionId, UUID phaseId);
}
