package com.excelisprepas.backend.personnel.domain.port.in;

import com.excelisprepas.backend.personnel.domain.model.Enseignant;

import java.math.BigDecimal;

public interface CreerEnseignantUseCase {
    Enseignant creerEnseignant(String nom, String prenom, String matricule, BigDecimal coutParSeance);
}
