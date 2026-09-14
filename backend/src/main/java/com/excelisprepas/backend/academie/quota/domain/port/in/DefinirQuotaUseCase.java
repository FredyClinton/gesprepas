package com.excelisprepas.backend.academie.quota.domain.port.in;

import com.excelisprepas.backend.academie.quota.domain.model.QuotaHebdomadaire;

import java.util.UUID;

public interface DefinirQuotaUseCase {
    QuotaHebdomadaire definirQuota(UUID formationId, UUID sessionId, UUID matiereId, int semaine, int quota);
}
