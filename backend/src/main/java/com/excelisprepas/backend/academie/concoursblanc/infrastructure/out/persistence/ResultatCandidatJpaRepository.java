package com.excelisprepas.backend.academie.concoursblanc.infrastructure.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ResultatCandidatJpaRepository extends JpaRepository<ResultatCandidatEntity, UUID> {
    List<ResultatCandidatEntity> findByConcoursBlancIdAndCentreId(UUID concoursBlancId, UUID centreId);
    List<ResultatCandidatEntity> findByConcoursBlancIdAndFormationId(UUID concoursBlancId, UUID formationId);
    List<ResultatCandidatEntity> findByConcoursBlancId(UUID concoursBlancId);
    Optional<ResultatCandidatEntity> findByConcoursBlancIdAndApprenantId(UUID concoursBlancId, UUID apprenantId);
    void deleteByConcoursBlancId(UUID concoursBlancId);
}

