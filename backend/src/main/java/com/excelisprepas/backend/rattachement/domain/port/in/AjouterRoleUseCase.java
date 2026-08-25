package com.excelisprepas.backend.rattachement.domain.port.in;

import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import com.excelisprepas.backend.rattachement.domain.model.AttributionRole;

import java.util.UUID;

public interface AjouterRoleUseCase {
    AttributionRole ajouterRole(UUID utilisateurId, UUID sessionId, RoleUtilisateur role);
}