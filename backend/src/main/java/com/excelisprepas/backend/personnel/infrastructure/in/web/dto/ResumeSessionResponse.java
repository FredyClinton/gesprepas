package com.excelisprepas.backend.personnel.infrastructure.in.web.dto;

import com.excelisprepas.backend.session.domain.model.StatutSession;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record ResumeSessionResponse(
        UUID sessionId,
        String libelleSession,
        StatutSession statutSession,
        List<String> nomsDepartements,
        int seancesEffectuees,
        int seancesTotales,
        BigDecimal coutParSeance
) {
}
