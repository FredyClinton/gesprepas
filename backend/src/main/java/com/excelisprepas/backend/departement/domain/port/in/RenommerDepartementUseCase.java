package com.excelisprepas.backend.departement.domain.port.in;

import com.excelisprepas.backend.departement.domain.model.Departement;

import java.util.UUID;

public interface RenommerDepartementUseCase {
    Departement renommerDepartement(UUID id, String nouveauNom);
}