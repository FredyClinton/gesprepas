package com.excelisprepas.backend.personnel.domain.port.in;

import com.excelisprepas.backend.personnel.domain.model.Personnel;

import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;

import java.util.UUID;

public interface ModifierPersonnelUseCase {
    /** appelant : rôle du jeton, contrôlé contre le compte éventuel du personnel visé. */
    Personnel modifierPersonnel(RoleUtilisateur appelant, UUID id, String nom, String prenom, String telephone, String numeroCni, String email);
}
