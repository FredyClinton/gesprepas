package com.excelisprepas.backend.rattachement.infrastructure.in.web.dto;

import java.util.UUID;

public record RattachementResponse(
        UUID id,
        UUID utilisateurId,
        UUID sessionId,
        UUID centreId
) {
}