package com.excelisprepas.backend.rattachement.domain.port.in;

import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;

import java.util.UUID;

public interface RetirerRoleUseCase {
    void retirerRole(UUID utilisateurId, UUID sessionId, RoleUtilisateur role);
}