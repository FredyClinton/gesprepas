package com.excelisprepas.backend.rattachement.infrastructure.in.web.dto;

import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;

import java.util.UUID;

public record AttributionRoleResponse(
        UUID id,
        UUID utilisateurId,
        UUID sessionId,
        RoleUtilisateur role
) {
}