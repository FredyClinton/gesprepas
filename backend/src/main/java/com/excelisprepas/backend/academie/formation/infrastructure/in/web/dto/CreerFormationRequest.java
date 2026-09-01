package com.excelisprepas.backend.academie.formation.infrastructure.in.web.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.Set;
import java.util.UUID;

public record CreerFormationRequest(
        @NotBlank(message = "Le nom est obligatoire") String nom,
        Set<UUID> matiereIds
) {
}
