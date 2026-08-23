package com.excelisprepas.backend.matiere.domain.port.in;

import com.excelisprepas.backend.matiere.domain.model.Matiere;

public interface CreerMatiereUseCase {
    Matiere creerMatiere(String nom);
}
