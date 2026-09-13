package com.excelisprepas.backend.academie.concoursblanc.infrastructure.in.web.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record BordereauResponse(
        ConcoursBlancResponse concoursBlanc,
        UUID formationId,
        List<EpreuveResponse> epreuves,
        Map<UUID, BigDecimal> meilleuresNotesParEpreuve,
        List<ResultatCandidatResponse> candidats
) {}

