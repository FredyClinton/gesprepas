package com.excelisprepas.backend.academie.affectationdepartementale.infrastructure.in.web.dto;

import java.util.UUID;

public record AffectationDepartementaleResponse(
        UUID id,
        UUID enseignantId,
        UUID sessionId,
        UUID departementId
) {
}
