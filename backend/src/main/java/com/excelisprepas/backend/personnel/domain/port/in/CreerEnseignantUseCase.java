package com.excelisprepas.backend.personnel.domain.port.in;

import com.excelisprepas.backend.personnel.domain.model.Enseignant;
import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;

import java.math.BigDecimal;

public interface CreerEnseignantUseCase {
    Enseignant creerEnseignant(RoleUtilisateur appelant, String nom, String prenom, String matricule, BigDecimal coutParSeance);
}
