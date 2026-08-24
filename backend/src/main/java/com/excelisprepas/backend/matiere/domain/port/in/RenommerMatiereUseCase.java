package com.excelisprepas.backend.matiere.domain.port.in;

import com.excelisprepas.backend.matiere.domain.model.Matiere;

import java.util.UUID;

public interface RenommerMatiereUseCase {
    Matiere renommerMatiere(UUID id, String nouveauNom);
}
