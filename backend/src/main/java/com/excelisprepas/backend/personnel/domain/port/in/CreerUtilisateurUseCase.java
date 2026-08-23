package com.excelisprepas.backend.personnel.domain.port.in;

import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import com.excelisprepas.backend.personnel.domain.model.Utilisateur;

public interface CreerUtilisateurUseCase {

    Utilisateur creerUtilisateur(String nom, String prenom, String email,
                                 String motDePasseClair, RoleUtilisateur role);
}
