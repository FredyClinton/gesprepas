package com.excelisprepas.backend.personnel.infrastructure.in.web.dto;

import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreerComptePersonnelRequest(
        @NotBlank(message = "Le mot de passe est obligatoire")
        String password,
        @NotNull(message = "Le rôle est obligatoire")
        RoleUtilisateur role,
        UUID centreId
) {
}
