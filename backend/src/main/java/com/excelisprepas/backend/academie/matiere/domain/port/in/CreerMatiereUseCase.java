package com.excelisprepas.backend.academie.matiere.domain.port.in;

import com.excelisprepas.backend.academie.matiere.domain.model.Matiere;

public interface CreerMatiereUseCase {
    default Matiere creerMatiere(String nom) {
        return creerMatiere(nom, null);
    }
    Matiere creerMatiere(String nom, String couleur);
}
