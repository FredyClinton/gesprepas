package com.excelisprepas.backend.rattachement.infrastructure.in.web.dto;

import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.Set;
import java.util.UUID;

public record RattacherRequest(
        @NotNull(message = "L'utilisateur est obligatoire") UUID utilisateurId,
        @NotNull(message = "La session est obligatoire") UUID sessionId,
        @NotNull(message = "Le centre est obligatoire") UUID centreId,
        @NotEmpty(message = "Au moins un rôle initial est requis") Set<RoleUtilisateur> rolesInitiaux
) {
}