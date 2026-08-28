package com.excelisprepas.backend.auth.infrastructure.in.web.dto;

import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;

import java.util.List;
import java.util.UUID;

public record UtilisateurConnecteResponse(
        UUID id,
        String nom,
        String prenom,
        String email,
        List<RoleUtilisateur> roles,
        UUID centreId
) {
}
