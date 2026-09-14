package com.excelisprepas.backend.academie.quota.domain.port.in;

import com.excelisprepas.backend.academie.quota.domain.model.QuotaHebdomadaire;

import java.util.List;
import java.util.UUID;

public interface ListerQuotasUseCase {
    List<QuotaHebdomadaire> listerQuotas(UUID formationId, UUID sessionId);
}
