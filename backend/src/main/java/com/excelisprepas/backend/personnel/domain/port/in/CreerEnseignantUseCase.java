package com.excelisprepas.backend.personnel.domain.port.in;

import com.excelisprepas.backend.personnel.domain.model.Enseignant;
import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;

import java.math.BigDecimal;
import java.time.LocalDate;

public interface CreerEnseignantUseCase {
    Enseignant creerEnseignant(RoleUtilisateur appelant, String nom, String prenom, String matricule, BigDecimal coutParSeance,
                               String telephone, String numeroCni, String ecoleFonction, String niveauGrade);

    Enseignant creerEnseignant(RoleUtilisateur appelant, String nom, String prenom, String matricule, BigDecimal coutParSeance,
                               String telephone, String numeroCni, String ecoleFonction, String niveauGrade, LocalDate dateRecrutement);
}
