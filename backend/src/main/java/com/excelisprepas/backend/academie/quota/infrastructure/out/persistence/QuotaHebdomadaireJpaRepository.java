package com.excelisprepas.backend.academie.quota.infrastructure.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface QuotaHebdomadaireJpaRepository extends JpaRepository<QuotaHebdomadaireEntity, UUID> {
    Optional<QuotaHebdomadaireEntity> findByFormationIdAndSessionIdAndMatiereIdAndSemaine(
            UUID formationId, UUID sessionId, UUID matiereId, int semaine);

    List<QuotaHebdomadaireEntity> findByFormationIdAndSessionId(UUID formationId, UUID sessionId);
}
