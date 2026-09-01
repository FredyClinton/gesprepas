package com.excelisprepas.backend.academie.matiere.domain.port.in;

import com.excelisprepas.backend.academie.matiere.domain.model.Matiere;

public interface CreerMatiereUseCase {
    Matiere creerMatiere(String nom);
}
