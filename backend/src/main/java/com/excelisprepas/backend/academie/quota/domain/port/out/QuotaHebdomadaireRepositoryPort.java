package com.excelisprepas.backend.academie.quota.domain.port.out;

import com.excelisprepas.backend.academie.quota.domain.model.QuotaHebdomadaire;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface QuotaHebdomadaireRepositoryPort {
    QuotaHebdomadaire save(QuotaHebdomadaire quota);

    Optional<QuotaHebdomadaire> findByFormationIdAndSessionIdAndMatiereIdAndSemaine(
            UUID formationId, UUID sessionId, UUID matiereId, int semaine);

    List<QuotaHebdomadaire> findByFormationIdAndSessionId(UUID formationId, UUID sessionId);
}
