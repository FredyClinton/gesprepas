package com.excelisprepas.backend.dossier.infrastructure.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DossierConcoursJpaRepository extends JpaRepository<DossierConcoursEntity, UUID> {
    List<DossierConcoursEntity> findByDossierId(UUID dossierId);

    boolean existsByDossierIdAndConcoursId(UUID dossierId, UUID concoursId);

    List<DossierConcoursEntity> findByConcoursIdAndSessionId(UUID concoursId, UUID sessionId);
}