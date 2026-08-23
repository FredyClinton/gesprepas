package com.excelisprepas.backend.personnel.infrastructure.in.web.dto;

import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreerUtilisateurRequest(
        @NotBlank(message = "Le nom est obligatoire") String nom,
        @NotBlank(message = "Le prénom est obligatoire") String prenom,
        @NotBlank(message = "L'email est obligatoire") String email,
        @NotBlank(message = "Le mot de passe est obligatoire") String motDePasseClair,
        @NotNull(message = "Le rôle est obligatoire") RoleUtilisateur role
) {
}
