package com.excelisprepas.backend.personnel.domain.port.in;

import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import com.excelisprepas.backend.personnel.domain.model.Utilisateur;

import java.util.UUID;

public interface CreerComptePersonnelUseCase {
    /** appelant : rôle du jeton ; il ne peut attribuer qu'un rôle qui ne dépasse pas ses propres droits. */
    Utilisateur creerCompte(RoleUtilisateur appelant, UUID personnelId, String password, RoleUtilisateur role, UUID centreId);
}
