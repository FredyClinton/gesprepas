package com.excelisprepas.backend.personnel.domain.port.in;

import com.excelisprepas.backend.personnel.domain.model.Enseignant;

import java.util.UUID;

public interface RenommerEnseignantUseCase {
    Enseignant renommerEnseignant(UUID id, String nouveauNom, String nouveauPrenom);
}