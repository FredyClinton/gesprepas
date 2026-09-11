package com.excelisprepas.backend.academie.matiere.domain.port.in;

import com.excelisprepas.backend.academie.matiere.domain.model.Matiere;

import java.util.UUID;

public interface ModifierMatiereUseCase {
    Matiere modifierMatiere(UUID id, String nom, String couleur);
}
