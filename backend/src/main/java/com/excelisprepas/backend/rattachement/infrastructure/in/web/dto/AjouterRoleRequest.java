package com.excelisprepas.backend.rattachement.infrastructure.in.web.dto;

import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AjouterRoleRequest(
        @NotNull(message = "L'utilisateur est obligatoire") UUID utilisateurId,
        @NotNull(message = "La session est obligatoire") UUID sessionId,
        @NotNull(message = "Le rôle est obligatoire") RoleUtilisateur role
) {
}