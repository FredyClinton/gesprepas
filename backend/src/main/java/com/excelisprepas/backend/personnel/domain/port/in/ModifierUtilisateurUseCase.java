package com.excelisprepas.backend.personnel.domain.port.in;

import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import com.excelisprepas.backend.personnel.domain.model.Utilisateur;

import java.util.UUID;

public interface ModifierUtilisateurUseCase {
    Utilisateur modifierUtilisateur(UUID id, RoleUtilisateur role, UUID centreId);
}
