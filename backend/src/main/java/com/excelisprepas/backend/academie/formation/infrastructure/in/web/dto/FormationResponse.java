package com.excelisprepas.backend.academie.formation.infrastructure.in.web.dto;

import java.util.Set;
import java.util.UUID;

public record FormationResponse(UUID id, String nom, Set<UUID> matiereIds) {
}
