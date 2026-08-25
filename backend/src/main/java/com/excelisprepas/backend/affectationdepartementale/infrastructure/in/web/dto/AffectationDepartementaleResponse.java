package com.excelisprepas.backend.affectationdepartementale.infrastructure.in.web.dto;

import java.util.UUID;

public record AffectationDepartementaleResponse(
        UUID id,
        UUID enseignantId,
        UUID sessionId,
        UUID departementId
) {
}
