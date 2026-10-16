package com.excelisprepas.backend.personnel.domain.port.in;

import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import com.excelisprepas.backend.personnel.domain.model.Utilisateur;

import java.util.UUID;

public interface CreerComptePersonnelUseCase {
    Utilisateur creerCompte(UUID personnelId, String password, RoleUtilisateur role, UUID centreId);
}
