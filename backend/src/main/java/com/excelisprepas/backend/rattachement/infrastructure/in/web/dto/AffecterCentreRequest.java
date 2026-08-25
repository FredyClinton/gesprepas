package com.excelisprepas.backend.rattachement.infrastructure.in.web.dto;

import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.Set;
import java.util.UUID;

public record AffecterCentreRequest(
        @NotNull(message = "Le centre est obligatoire") UUID centreId,
        @NotEmpty(message = "Les nouveaux rôles sont obligatoires") Set<RoleUtilisateur> nouveauxRoles
) {
}