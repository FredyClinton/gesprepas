package com.excelisprepas.backend.personnel.infrastructure.in.web.dto;

import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;

import java.util.UUID;

public record UtilisateurResponse(
        UUID id,
        String nom,
        String prenom,
        String telephone,
        String numeroCni,
        String email,
        RoleUtilisateur role,
        UUID centreId,
        UUID departementId
) {
    public UtilisateurResponse(UUID id, String nom, String prenom, String telephone,
                               String numeroCni, String email, RoleUtilisateur role, UUID centreId) {
        this(id, nom, prenom, telephone, numeroCni, email, role, centreId, null);
    }
}
