package com.excelisprepas.backend.personnel.infrastructure.in.web.dto;

import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ModifierUtilisateurRequest(
        @NotNull(message = "Le rôle est obligatoire")
        RoleUtilisateur role,
        UUID centreId
) {
}
