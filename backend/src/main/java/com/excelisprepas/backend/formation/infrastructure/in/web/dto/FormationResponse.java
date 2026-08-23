package com.excelisprepas.backend.formation.infrastructure.in.web.dto;

import java.util.UUID;

public record FormationResponse(UUID id, String nom, UUID centreId, UUID sessionId) {
}
